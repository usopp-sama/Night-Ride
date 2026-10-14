// Offline render of the engine-sim LS V8: idle -> full-throttle sweep -> lift-off.
// Usage: night_engine_render <engine 0=LS|1=F136> <out.wav> [freq steps]. Writes the dry
// (pre-impulse-response) signal and prints the realtime factor.
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <fstream>
#include <vector>

extern "C" {
int nr_es_init(int engine_id);
void nr_es_control(float rpm, float throttle);
float* nr_es_render(int frames);
float nr_es_rpm();
void nr_es_quality(int frequency, int fluid_steps);
}

int main(int argc, char** argv) {
  if (argc < 3) { std::fprintf(stderr, "usage: %s engine-id out.wav\n", argv[0]); return 2; }
  const int engine_id = std::atoi(argv[1]);
  nr_es_init(engine_id);
  const double top = engine_id == 1 ? 8800 : 6200;
  if (argc >= 5) nr_es_quality(std::atoi(argv[3]), std::atoi(argv[4]));
  const int rate = 44100, block = 128, seconds = 12;
  std::vector<std::int16_t> pcm;
  double peak = 0, sum = 0, worst_tracking = 0;
  const auto t0 = std::chrono::steady_clock::now();
  for (int b = 0; b < rate * seconds / block; ++b) {
    const double t = static_cast<double>(b * block) / rate;
    float rpm = 800, throttle = 0;
    if (t > 3 && t < 9) { rpm = static_cast<float>(800 + (t - 3) / 6 * (top - 800)); throttle = 1; }
    else if (t >= 9) { rpm = static_cast<float>(std::max(800.0, top - (t - 9) * 3500)); }
    nr_es_control(rpm, throttle);
    const float* s = nr_es_render(block);
    for (int i = 0; i < block; ++i) {
      peak = std::max(peak, static_cast<double>(std::abs(s[i]))); sum += s[i] * s[i];
      pcm.push_back(static_cast<std::int16_t>(std::lround(std::clamp(s[i], -1.0f, 1.0f) * 32767)));
    }
    if (b % (rate / block) == 0) {
      std::printf("t=%4.1fs target=%5.0f engine=%6.0f rpm\n", t, rpm, nr_es_rpm());
      // The dynamometer eases toward the target, so allow a short lag.
      if (t >= 1) worst_tracking = std::max(worst_tracking, static_cast<double>(std::abs(nr_es_rpm() - rpm) / rpm));
    }
  }
  const double elapsed = std::chrono::duration<double>(std::chrono::steady_clock::now() - t0).count();
  std::printf("rendered %ds in %.2fs (%.1fx realtime), peak %.3f rms %.4f\n", seconds, elapsed, seconds / elapsed, peak, std::sqrt(sum / pcm.size()));
  std::ofstream out(argv[2], std::ios::binary);
  const std::uint32_t data = static_cast<std::uint32_t>(pcm.size() * 2), riff = 36 + data, fmt = 16, byte_rate = rate * 2;
  const std::uint16_t pcm_format = 1, mono = 1, align = 2, bits = 16;
  out.write("RIFF", 4); out.write(reinterpret_cast<const char*>(&riff), 4); out.write("WAVEfmt ", 8);
  out.write(reinterpret_cast<const char*>(&fmt), 4); out.write(reinterpret_cast<const char*>(&pcm_format), 2);
  out.write(reinterpret_cast<const char*>(&mono), 2); out.write(reinterpret_cast<const char*>(&rate), 4);
  out.write(reinterpret_cast<const char*>(&byte_rate), 4); out.write(reinterpret_cast<const char*>(&align), 2);
  out.write(reinterpret_cast<const char*>(&bits), 2); out.write("data", 4); out.write(reinterpret_cast<const char*>(&data), 4);
  out.write(reinterpret_cast<const char*>(pcm.data()), data);
  std::printf("worst RPM tracking error %.1f%%\n", worst_tracking * 100);
  return peak > 0.01 && worst_tracking < 0.05 ? 0 : 1;
}
