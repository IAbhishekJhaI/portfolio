---
title: Arithmecrypt
summary: An FPGA prototype of 11 arithmetic building blocks for cryptography, written in Verilog. Finalist at the Odisha Semiconductor Design Challenge.
category: electronics
stack: [Verilog, Vivado, FPGA, Nexys4 DDR]
period: Apr 2024
highlights:
  - '**Finalist**, Odisha Semiconductor Design Challenge (with Vaddi Divya).'
  - 'Implemented and verified **11 modules** on a Nexys4 DDR board, from GCD (extended Euclid) to the Chinese Remainder Theorem.'
  - 'The largest module, matrix multiplication, fits in **284 LUTs** with a **9.3 ns** critical path.'
links: {}
featured: true
order: 5
---
## What it is
Public-key cryptography is built on a handful of number-theory operations. Arithmecrypt implements them as hardware modules on an FPGA, selected by a 4-bit control input, with 8-bit operands and an 8-bit result.

## Modules
GCD via the extended Euclidean algorithm · modulo · left shift · right shift · matrix addition · matrix multiplication · congruence · modular exponentiation · Fermat's little theorem · Chinese Remainder Theorem · multiplicative inverse.

## Results
Synthesized in Vivado and tested on a Nexys4 DDR board. Resource use ranges from **4 LUTs** (the shifts) to **284 LUTs** (matrix multiplication), with critical paths between **4.16 ns and 9.3 ns**. Modular inverse is the next module to finish.
