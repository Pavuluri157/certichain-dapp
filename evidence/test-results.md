# CertiChain Automated Test Results

Test environment: Solidity 0.8.37 targeting Paris EVM, Ganache 7.9.2, Ethers.js 6.17.0

| Test case | Category | Expected result | Observed result |
|---|---|---|---|
| Owner issues a complete certificate | Valid | Transaction succeeds and data is stored | Passed |
| Empty student name | Invalid | Transaction reverts with validation message | Passed |
| Duplicate certificate ID | Invalid | Transaction reverts because the record exists | Passed |
| Non-owner attempts to issue | Unauthorised | Transaction reverts with owner-only message | Passed |
| Owner revokes an existing certificate | Valid | Transaction succeeds and `revoked` becomes true | Passed |
| Revoke a missing certificate | Invalid | Transaction reverts because the record does not exist | Passed |

Automated test summary: **6 passing, 0 failing**.
