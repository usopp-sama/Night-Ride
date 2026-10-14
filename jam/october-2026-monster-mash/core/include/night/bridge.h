#pragma once
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
// ABI 1. Synchronous, single-threaded. UTF-8 bytes; no terminating NUL required.
// Status: 0 success, 1 invalid input, 2 generation validation failed.
// Output/error pointers are module-owned and valid only until the next generate.
// Callers must copy output before another call or memory growth; never free it.
uint32_t nr_api_version(void);
uint32_t nr_generate(const char* seed, uint32_t length);
const char* nr_result_ptr(void);
uint32_t nr_result_size(void);
const char* nr_error_ptr(void);
uint32_t nr_error_size(void);
#ifdef __cplusplus
}
#endif

