// Real engine-sim (Ange Yaghi, MIT) running the GM LS V8 from
// vendor/engine-sim/engines/07_gm_ls.mr. The .mr script is translated by hand
// into the same object graph that engine-sim's Piranha script nodes build
// (scripting/include/*_node.h upstream), so no script compiler is shipped.
//
// The Night Ride vehicle solver stays authoritative for motion. engine-sim's
// dynamometer holds the crank at the RPM our drivetrain reports while the
// player's throttle drives combustion, so the gas/combustion/exhaust model
// produces the sound for every RPM/load combination.
#include "engine.h"
#include "fuel.h"
#include "function.h"
#include "gas_system.h"
#include "piston_engine_simulator.h"
#include "standard_valvetrain.h"
#include "direct_throttle_linkage.h"
#include "impulse_response.h"
#include "transmission.h"
#include "vehicle.h"
#include "units.h"
#include "constants.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace {
Engine* engine = nullptr;
Vehicle* vehicle = nullptr;
Transmission* transmission = nullptr;
Simulator* simulator = nullptr;
std::vector<std::int16_t> pcm(4096);
std::vector<float> output(4096);
double target_rpm = 800, smoothed_throttle = 0, target_throttle = 0;
int warmup_blocks = 0;

Function* flow_function(const double (&samples)[10][2]) {
  // function intake_flow(50 * units.thou) + add_flow_sample(lift, flow)
  auto* f = new Function;
  f->initialize(10, units::distance(50, units::thou));
  for (const auto& s : samples) f->addSample(s[0] * units::thou, GasSystem::k_28inH2O(s[1]));
  return f;
}

Function* harmonic_lobe(double duration_at_50_thou, double gamma, double lift, int steps) {
  // __engine_sim__generate_harmonic_cam_lobe (scripting/include/actions.h)
  const double angle = duration_at_50_thou / 4;
  const double s = std::pow(2 * units::distance(50, units::thou) / lift, 1 / gamma) - 1;
  const double k = std::acos(s) / angle;
  const double extents = constants::pi / k;
  const double step = extents / (steps - 5.0);
  auto* f = new Function;
  f->initialize(steps * 2, step);
  for (int i = 0; i < steps; ++i) {
    if (i == 0) { f->addSample(0.0, lift); continue; }
    const double x = i * step;
    const double y = x >= extents ? 0.0 : lift * std::pow(0.5 + 0.5 * std::cos(k * x), gamma);
    f->addSample(x, y); f->addSample(-x, y);
  }
  return f;
}

// Every number that differs between the atg-video-2 engine scripts.
struct EngineSpec {
  const char* name;
  double stroke, bore, redline_rpm, rev_limit_rpm, limiter_duration, jitter, idle_plate;
  double tdc_sign;           // tdc: 90 deg -/+ v_angle / 2
  double journals[4];        // rod journal angles, degrees
  double bank_sign[2];       // bank angle = sign * v_angle / 2
  double exhaust_length[2], exhaust_volume[2], primary_flow_cfm, exhaust_velocity_decay;
  double primary[2][4], attenuation[2][4];
  int lobe_order[2][4];      // camshaft rot multipliers per bank cylinder
  int wire[2][4];            // ignition wire per bank cylinder
  int posts[8];              // wire at each 90-degree ignition post
  double flow50_intake, flow50_exhaust, intake_lobe_duration, exhaust_lobe_duration, lobe_gamma;
};

constexpr double spacing_ls = 2;  // inches
const EngineSpec gm_ls{
  "GM LS", 3.622 * units::inch, 3.78 * units::inch, 6500, 6800, 0.2, 0.6, 0.996, -1,
  {0, 270, 90, 180}, {-1, 1},
  {100 * units::inch, 172 * units::inch}, {4.0, 4.0}, 500, 1.0,
  {{(3 * spacing_ls * 2.54 + 2) * units::cm, (2 * spacing_ls * 2.54 + 1) * units::cm, (1 * spacing_ls * 2.54 + 3) * units::cm, 5 * units::cm},
   {(3 * spacing_ls * 2.54 + 1) * units::cm, (2 * spacing_ls * 2.54 + 5) * units::cm, (1 * spacing_ls * 2.54 + 7) * units::cm, 0}},
  {{1, 1, 1, 1}, {1, 1, 1, 1}},
  {{0, 7, 5, 2}, {3, 6, 4, 1}},
  {{1, 3, 5, 7}, {2, 4, 6, 8}},
  {1, 8, 7, 2, 6, 5, 4, 3},
  1, 1, 234 * units::deg, 235 * units::deg, 1.1};
// The 458 Italia's flat-plane F136 (08_ferrari_f136_v8.mr).
const EngineSpec ferrari_f136{
  "Ferrari F136", 81 * units::mm, 94 * units::mm, 9000, 9300, 0.1, 0.15, 0.995, 1,
  {0, 180, 180, 0}, {1, -1},
  {100 * units::inch, 100 * units::inch}, {2.0 * 0.1, 2.0 * 0.09}, 600, 0.5,
  {{2 * units::cm, 1 * units::cm, 3 * units::cm, 5 * units::cm}, {1 * units::cm, 5 * units::cm, 7 * units::cm, 0}},
  {{0.9, 0.8, 1.1, 1.0}, {1.0, 0.8, 0.9, 0.7}},
  {{0, 6, 2, 4}, {1, 7, 3, 5}},
  {{1, 2, 3, 4}, {5, 6, 7, 8}},
  {1, 5, 3, 7, 4, 8, 2, 6},
  58, 37, 230 * units::deg, 230 * units::deg, 0.9};

void build_engine(const EngineSpec& spec) {
  const double stroke = spec.stroke, bore = spec.bore;
  const double rod_length = 160 * units::mm, rod_mass = 50 * units::g;
  const double compression_height = 1.0 * units::inch;
  const double crank_mass = 60 * units::lb, flywheel_mass = 30 * units::lb, flywheel_radius = 8 * units::inch;
  const double v_angle = 90 * units::deg;
  auto disk = [](double m, double r) { return 0.5 * m * r * r; };

  engine = new Engine;
  Engine::Parameters ep;
  ep.name = spec.name;
  ep.cylinderBanks = 2; ep.cylinderCount = 8; ep.crankshaftCount = 1;
  ep.exhaustSystemCount = 2; ep.intakeCount = 1;
  ep.starterTorque = units::torque(200, units::ft_lb);
  ep.starterSpeed = units::rpm(200);
  ep.redline = units::rpm(spec.redline_rpm);
  ep.dynoMinSpeed = units::rpm(1000); ep.dynoMaxSpeed = ep.redline; ep.dynoHoldStep = units::rpm(100);
  auto* throttle = new DirectThrottleLinkage;
  DirectThrottleLinkage::Parameters tp; tp.gamma = 2.0; throttle->initialize(tp);
  ep.throttle = throttle;
  ep.initialSimulationFrequency = 10000;
  ep.initialHighFrequencyGain = 0.01;
  ep.initialNoise = 1.0;
  ep.initialJitter = spec.jitter;
  engine->initialize(ep);

  // The impulse response itself is applied in WebAudio (see web/engine-audio.ts).
  auto* ir = new ImpulseResponse; ir->initialize(spec.name, 1.0);
  for (int i = 0; i < 2; ++i) {
    ExhaustSystem::Parameters xp;
    xp.length = spec.exhaust_length[i];
    xp.collectorCrossSectionArea = constants::pi * std::pow(2.0 * units::inch, 2);
    xp.outletFlowRate = GasSystem::k_carb(1000.0);
    xp.primaryTubeLength = 29.0 * units::inch;
    xp.primaryFlowRate = GasSystem::k_carb(spec.primary_flow_cfm);
    xp.velocityDecay = spec.exhaust_velocity_decay;
    xp.audioVolume = spec.exhaust_volume[i];
    xp.impulseResponse = ir;
    engine->getExhaustSystem(i)->initialize(xp);
  }

  Intake::Parameters ip;
  ip.volume = 1.325 * units::L;
  ip.CrossSectionArea = 20.0 * units::cm2;
  ip.InputFlowK = GasSystem::k_carb(700.0);
  ip.RunnerFlowRate = GasSystem::k_carb(100.0);
  ip.RunnerLength = 12.0 * units::inch;
  ip.IdleFlowK = GasSystem::k_carb(0.0);
  ip.IdleThrottlePlatePosition = spec.idle_plate;
  ip.VelocityDecay = 0.5;
  ip.MolecularAfr = 25.0 / 2.0;
  Intake* intake = engine->getIntake(0);
  intake->initialize(ip);

  Crankshaft* crank = engine->getCrankshaft(0);
  Crankshaft::Parameters cp;
  cp.crankThrow = stroke / 2;
  cp.flywheelMass = flywheel_mass;
  cp.mass = crank_mass;
  cp.frictionTorque = units::torque(20.0, units::ft_lb);
  cp.momentOfInertia = 1.5 * disk(crank_mass, stroke) + disk(flywheel_mass, flywheel_radius) + disk(1 * units::kg, 1.0 * units::cm);
  cp.pos_x = 0; cp.pos_y = 0;
  cp.tdc = 90 * units::deg + spec.tdc_sign * v_angle / 2.0;
  cp.rodJournals = 4;
  crank->initialize(cp);
  for (int j = 0; j < 4; ++j) crank->setRodJournalAngle(j, spec.journals[j] * units::deg);

  // Cam lobes shared by both heads (function nodes are cached by the script context).
  Function* intake_lobe = harmonic_lobe(spec.intake_lobe_duration, spec.lobe_gamma, 551 * units::thou, 256);
  Function* exhaust_lobe = harmonic_lobe(spec.exhaust_lobe_duration, spec.lobe_gamma, 551 * units::thou, 256);
  const double rot = 90 * units::deg, rot360 = 360 * units::deg, lobe_center = 116 * units::deg;

  const double intake_flow[10][2] = {{0,0},{50,spec.flow50_intake},{100,103},{150,156},{200,214},{250,249},{300,268},{350,280},{400,280},{450,281}};
  const double exhaust_flow[10][2] = {{0,0},{50,spec.flow50_exhaust},{100,72},{150,113},{200,160},{250,196},{300,222},{350,235},{400,245},{450,246}};

  Piston::Parameters pp{};
  pp.mass = 100 * units::g;
  pp.CompressionHeight = compression_height;
  pp.WristPinPosition = 0.0;
  pp.Displacement = 0.0;
  pp.BlowbyFlowCoefficient = GasSystem::k_28inH2O(0.0);
  ConnectingRod::Parameters rp;
  rp.mass = rod_mass;
  rp.momentOfInertia = (1 / 12.0) * rod_mass * rod_length * rod_length;
  rp.centerOfMass = 0.0;
  rp.length = rod_length;
  rp.slaveThrow = 0;
  rp.rodJournals = 0;
  rp.master = nullptr;

  for (int b = 0; b < 2; ++b) {
    CylinderBank* bank = engine->getCylinderBank(b);
    CylinderBank::Parameters bp;
    bp.crankshaft = crank;
    bp.positionX = 0; bp.positionY = 0;
    bp.angle = spec.bank_sign[b] * v_angle / 2.0;
    bp.bore = bore;
    bp.deckHeight = stroke / 2 + rod_length + compression_height;
    bp.displayDepth = 0.5;
    bp.cylinderCount = 4;
    bp.index = b;
    bank->initialize(bp);

    for (int i = 0; i < 4; ++i) {
      const int global = b * 4 + i;
      Piston* piston = engine->getPiston(global);
      ConnectingRod* rod = engine->getConnectingRod(global);
      Piston::Parameters p = pp; p.Bank = bank; p.CylinderIndex = i; p.Rod = rod;
      piston->initialize(p);
      ConnectingRod::Parameters r = rp; r.crankshaft = crank; r.journal = i; r.piston = piston;
      rod->initialize(r);
    }

    auto* intake_cam = new Camshaft, *exhaust_cam = new Camshaft;
    Camshaft::Parameters cam;
    cam.advance = 0; cam.baseRadius = 1.0 * units::inch; cam.crankshaft = crank; cam.lobes = 4;
    cam.lobeProfile = intake_lobe; intake_cam->initialize(cam);
    cam.lobeProfile = exhaust_lobe; exhaust_cam->initialize(cam);
    for (int l = 0; l < 4; ++l) {
      exhaust_cam->setLobeCenterline(l, rot360 - lobe_center + spec.lobe_order[b][l] * rot);
      intake_cam->setLobeCenterline(l, rot360 + lobe_center + spec.lobe_order[b][l] * rot);
    }
    auto* valvetrain = new StandardValvetrain;
    StandardValvetrain::Parameters vp; vp.intakeCamshaft = intake_cam; vp.exhaustCamshaft = exhaust_cam;
    valvetrain->initialize(vp);

    CylinderHead* head = engine->getHead(b);
    CylinderHead::Parameters hp;
    hp.Bank = bank;
    hp.Valvetrain = valvetrain;
    hp.IntakePortFlow = flow_function(intake_flow);
    hp.ExhaustPortFlow = flow_function(exhaust_flow);
    hp.CombustionChamberVolume = 90 * units::cc;
    hp.IntakeRunnerVolume = 149.6 * units::cc;
    hp.IntakeRunnerCrossSectionArea = 2.2 * units::inch * 2.2 * units::inch;
    hp.ExhaustRunnerVolume = 50.0 * units::cc;
    hp.ExhaustRunnerCrossSectionArea = 1.75 * units::inch * 1.75 * units::inch;
    hp.FlipDisplay = false;
    head->initialize(hp);
    for (int i = 0; i < 4; ++i) {
      head->setIntake(i, intake);
      head->setExhaustSystem(i, engine->getExhaustSystem(b));
      head->setSoundAttenuation(i, spec.attenuation[b][i]);
      head->setHeaderPrimaryLength(i, spec.primary[b][i]);
    }
  }

  // ignition_module: wires 1,8,7,2,6,5,4,3 at 90 degree posts.
  auto* timing = new Function;
  timing->initialize(9, units::rpm(1000));
  const double advance[9] = {12, 12, 20, 30, 40, 40, 40, 40, 40};
  for (int i = 0; i < 9; ++i) timing->addSample(units::rpm(1000.0 * i), advance[i] * units::deg);
  IgnitionModule::Parameters ign;
  ign.crankshaft = crank; ign.cylinderCount = 8; ign.revLimit = units::rpm(spec.rev_limit_rpm); ign.limiterDuration = spec.limiter_duration;
  ign.timingCurve = timing;
  engine->getIgnitionModule()->initialize(ign);
  int wire_to_cylinder[9] = {};
  for (int b = 0; b < 2; ++b) for (int i = 0; i < 4; ++i) wire_to_cylinder[spec.wire[b][i]] = b * 4 + i;
  for (int i = 0; i < 8; ++i) engine->getIgnitionModule()->setFiringOrder(wire_to_cylinder[spec.posts[i]], i * 90 * units::deg);

  auto* turbulence = new Function;
  turbulence->initialize(10, 5.0);
  turbulence->addSample(0.0, 3.0);
  const double ratio[10] = {0, 1.5, 1.75, 2, 2, 2, 2, 2, 2, 2};
  for (int i = 1; i < 10; ++i) turbulence->addSample(5.0 * i, ratio[i] * 5.0 * i);
  Fuel::Parameters fp;
  fp.maxBurningEfficiency = 1.0;
  fp.maxDilutionEffect = 10.0;  // engine_sim.mr default (C++ default differs)
  fp.turbulenceToFlameSpeedRatio = turbulence;
  engine->getFuel()->initialize(fp);

  auto* turbulence_from_speed = new Function;
  turbulence_from_speed->initialize(30, 1);
  for (int i = 0; i < 30; ++i) turbulence_from_speed->addSample(i, i * 0.5);
  CombustionChamber::Parameters cc;
  cc.CrankcasePressure = units::pressure(1.0, units::atm);
  cc.Fuel = engine->getFuel();
  cc.StartingPressure = units::pressure(1.0, units::atm);
  cc.StartingTemperature = units::celcius(25.0);
  cc.MeanPistonSpeedToTurbulence = turbulence_from_speed;
  for (int i = 0; i < 8; ++i) {
    cc.Piston = engine->getPiston(i);
    cc.Head = engine->getHead(cc.Piston->getCylinderBank()->getIndex());
    engine->getChamber(i)->initialize(cc);
  }
  engine->calculateDisplacement();

  // corvette() and corvette_transmission() from the script; the gearbox stays
  // in neutral because Night Ride's own drivetrain moves the car.
  vehicle = new Vehicle;
  Vehicle::Parameters vehicle_params;
  vehicle_params.mass = 1614 * units::kg;
  vehicle_params.dragCoefficient = 0.3;
  vehicle_params.crossSectionArea = (72 * units::inch) * (50 * units::inch);
  vehicle_params.diffRatio = 3.42;
  vehicle_params.tireRadius = 10 * units::inch;
  vehicle_params.rollingResistance = 200;
  vehicle->initialize(vehicle_params);
  static const double gears[6] = {2.97, 2.07, 1.43, 1.00, 0.71, 0.57};
  transmission = new Transmission;
  Transmission::Parameters gp; gp.GearCount = 6; gp.GearRatios = gears; gp.MaxClutchTorque = units::torque(500, units::ft_lb);
  transmission->initialize(gp);
}

std::uint32_t noise_state = 0x6d2b79f5u;
float noise() {
  noise_state ^= noise_state << 13; noise_state ^= noise_state >> 17; noise_state ^= noise_state << 5;
  return static_cast<float>(noise_state) / 2147483648.0f - 1.0f;
}

// Synthesizer::renderAudio(int) minus the time-domain convolution, which
// dominated CPU (10k taps per channel per sample).
std::int16_t render_dry_sample(Synthesizer& synth, int input_sample) {
  const auto& p = synth.m_audioParameters;
  float signal = 0;
  for (int i = 0; i < synth.m_inputChannelCount; ++i) {
    auto& filters = synth.m_filters[i];
    const float f_in = filters.jitterFilter.fast_f(synth.m_inputChannels[i].transferBuffer[input_sample]);
    const float f = f_in - filters.inputDcFilter.fast_f(f_in);
    const float f_p = filters.derivative.f(f_in);
    const float r = synth.m_filters->airNoiseLowPass.fast_f(noise());
    const float r_mixed = p.airNoise * r + (1 - p.airNoise);
    float v_in = f_p * p.dF_F_mix + f * r_mixed * (1 - p.dF_F_mix);
    if (std::fpclassify(v_in) == FP_SUBNORMAL) v_in = 0;
    signal += v_in;
  }
  signal = synth.m_antialiasing.fast_f(signal);
  synth.m_levelingFilter.p_target = p.levelerTarget;
  const long level = std::lround(synth.m_levelingFilter.f(signal) * p.volume);
  return static_cast<std::int16_t>(std::clamp<long>(level, INT16_MIN, INT16_MAX));
}

void pump_synthesizer(Synthesizer& synth, int want) {
  // Synthesizer::renderAudio() without its thread/condition variable: render
  // just enough input to keep `want` output samples buffered.
  const bool input_ready = synth.m_inputChannels[0].data.size() > 0 && !synth.m_processed;
  if (!input_ready) return;
  const int n = std::min(std::max(0, want - static_cast<int>(synth.m_audioBuffer.size())),
                         static_cast<int>(synth.m_inputChannels[0].data.size()));
  for (int i = 0; i < synth.m_inputChannelCount; ++i) synth.m_inputChannels[i].data.read(n, synth.m_inputChannels[i].transferBuffer);
  synth.m_inputSamplesRead = n;
  synth.m_processed = true;
  for (int i = 0; i < synth.m_inputChannelCount; ++i) {
    synth.m_filters[i].airNoiseLowPass.setCutoffFrequency(static_cast<float>(synth.m_audioParameters.airNoiseFrequencyCutoff), synth.m_audioSampleRate);
    synth.m_filters[i].jitterFilter.setJitterScale(synth.m_audioParameters.inputSampleNoise);
  }
  for (int i = 0; i < n; ++i) synth.m_audioBuffer.write(render_dry_sample(synth, i));
}
}  // namespace

extern "C" {
// Returns the number of exhaust channels.
// engine_id: 0 = GM LS (07_gm_ls.mr), 1 = Ferrari F136 (08_ferrari_f136_v8.mr).
int nr_es_init(int engine_id) {
  if (simulator) return engine->getExhaustSystemCount();
  build_engine(engine_id == 1 ? ferrari_f136 : gm_ls);
  simulator = engine->createSimulator(vehicle, transmission);
  simulator->setSimulationFrequency(static_cast<int>(engine->getSimulationFrequency()));
  simulator->setTargetSynthesizerLatency(0.02);
  Synthesizer::AudioParameters audio = simulator->synthesizer().getAudioParameters();
  audio.inputSampleNoise = static_cast<float>(engine->getInitialJitter());
  audio.airNoise = static_cast<float>(engine->getInitialNoise());
  audio.dF_F_mix = static_cast<float>(engine->getInitialHighFrequencyGain());
  // The exhaust IR convolution runs in WebAudio's FFT ConvolverNode instead
  // (same upstream IR on both channels, so it is applied after the mix).
  audio.convolution = 0.0f;
  audio.levelerTarget = 16000.0f;  // headroom before int16 output
  simulator->synthesizer().setAudioParameters(audio);
  // Drop the second of silence the synthesizer preloads for its thread.
  Synthesizer& synth = simulator->synthesizer();
  synth.m_audioBuffer.removeBeginning(synth.m_audioBuffer.size());
  engine->getIgnitionModule()->m_enabled = true;
  simulator->m_starterMotor.m_enabled = true;
  simulator->m_dyno.m_enabled = true;
  simulator->m_dyno.m_hold = true;
  simulator->m_dyno.m_rotationSpeed = units::rpm(800);
  transmission->changeGear(-1);
  warmup_blocks = 0;
  return engine->getExhaustSystemCount();
}


// rpm: drivetrain engine speed; throttle: 0..1 pedal.
void nr_es_control(float rpm, float throttle) {
  target_rpm = std::clamp(std::isfinite(rpm) ? static_cast<double>(rpm) : 800.0, 650.0, units::toRpm(engine ? engine->getRedline() : units::rpm(6500)) + 300);
  target_throttle = std::clamp(std::isfinite(throttle) ? static_cast<double>(throttle) : 0.0, 0.0, 1.0);
}

// Renders `frames` mono samples at 44.1 kHz into the returned buffer.
float* nr_es_render(int frames) {
  frames = std::clamp(frames, 1, 4096);
  if (!simulator) { std::fill(output.begin(), output.begin() + frames, 0.0f); return output.data(); }
  if (++warmup_blocks > 120) simulator->m_starterMotor.m_enabled = false;  // ~0.35 s of cranking
  smoothed_throttle += (target_throttle - smoothed_throttle) * 0.15;
  // Light idle throttle keeps combustion alive while the dyno holds speed.
  engine->setSpeedControl(std::max(smoothed_throttle, 0.02));
  const double current = units::toRpm(simulator->m_dyno.m_rotationSpeed);
  simulator->m_dyno.m_rotationSpeed = units::rpm(current + (target_rpm - current) * 0.12);

  simulator->startFrame(static_cast<double>(frames) / 44100.0);
  while (simulator->simulateStep()) {}
  simulator->endFrame();
  Synthesizer& synth = simulator->synthesizer();
  pump_synthesizer(synth, frames * 3);
  synth.readAudioOutput(frames, pcm.data());
  for (int i = 0; i < frames; ++i) output[static_cast<std::size_t>(i)] = static_cast<float>(pcm[static_cast<std::size_t>(i)]) / 32768.0f;
  return output.data();
}

// Quality knobs: simulation frequency (Hz) and gas-dynamics substeps per tick.
void nr_es_quality(int frequency, int fluid_steps) {
  if (!simulator) return;
  simulator->setSimulationFrequency(std::clamp(frequency, 4000, 20000));
  static_cast<PistonEngineSimulator*>(simulator)->setFluidSimulationSteps(std::clamp(fluid_steps, 1, 8));
}

float nr_es_rpm() { return engine ? static_cast<float>(engine->getRpm()) : 0.0f; }
}
