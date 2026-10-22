# CertiChain

CertiChain is an Ethereum DApp for issuing, verifying, and revoking academic certificates. It addresses certificate fraud by storing a tamper-resistant verification record on the blockchain. An institution controls issuance and revocation through the contract-owner wallet, while anyone with the certificate reference can retrieve and verify the record.

## Features

- Owner-only certificate issuance and revocation
- Public certificate verification
- Validation for blank values, duplicate IDs, missing records, and unauthorised callers
- MetaMask connection using Ethers.js
- On-chain transaction submission and blockchain data retrieval
- Responsive HTML, CSS, and JavaScript interface

## Technology

- Solidity 0.8.20+
- Ethereum-compatible Ganache local blockchain
- Remix IDE for contract compilation and deployment
- MetaMask wallet
- Ethers.js 6
- HTML, CSS, and JavaScript
- Mocha, Chai, Ganache, and Solc for repeatable automated testing

## Repository Structure

```text
contracts/                 Solidity smart contract
frontend/                  DApp user interface
scripts/                   Compile, deploy, and evidence scripts
test/                      Automated smart contract tests
build/                     Generated ABI and bytecode
evidence/                  Test and transaction results
deployment.json            Deployment network, address, and ABI
```

## Contract Rules

The wallet that deploys `CertiChain.sol` becomes the institution owner.

- Only the owner can issue certificates.
- Only the owner can revoke certificates.
- Certificate IDs cannot be empty or reused.
- Student and course names cannot be empty.
- Missing certificates cannot be revoked.
- Anyone can retrieve a certificate record.

The human-readable certificate reference is hashed with `ethers.id()` before it is passed to the contract as a `bytes32` identifier.

## Deployment Details

The included demonstration deployment was made on a local Ganache network.

- Network: Ganache Local
- Chain ID: `1337`
- RPC URL: `http://127.0.0.1:7545`
- Contract address: `0xC89Ce4735882C9F0f0FE26686c53074E09B0D550`

The local address remains valid only while the supplied Ganache chain session is running. A fresh Ganache session requires redeployment and produces a new `deployment.json` and `frontend/config.js`.

## Run the Application

### 1. Install dependencies

```bash
pnpm install
```

`npm install` may be used instead if pnpm is unavailable.

### 2. Compile the contract

```bash
npm run compile
```

### 3. Start Ganache

Open a separate terminal:

```bash
npm run ganache
```

### 4. Deploy the contract

```bash
npm run deploy
```

The deployment script writes the contract address and ABI to `deployment.json` and updates `frontend/config.js`.

### 5. Start the frontend

```bash
npm run serve
```

Open `http://127.0.0.1:8080` in a browser containing MetaMask.

## Compile and Deploy with Remix IDE

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create `CertiChain.sol` in the Remix file explorer and paste the contents of `contracts/CertiChain.sol`.
3. Open **Solidity Compiler**, select a compatible `0.8.x` compiler, choose the **Paris** EVM version if the Ganache release does not support newer opcodes, and compile `CertiChain.sol`.
4. Start Ganache on port `7545` with chain ID `1337`.
5. Add the Ganache network to MetaMask:
   - Network name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency symbol: `ETH`
6. Import one Ganache test account into MetaMask. Use only a Ganache test key; never use or publish a real wallet key.
7. In Remix **Deploy & Run Transactions**, select **Injected Provider - MetaMask**.
8. Confirm that Remix shows chain ID `1337`, select `CertiChain`, and click **Deploy**.
9. Confirm the deployment transaction in MetaMask.
10. Copy the deployed address into `frontend/config.js` if deployment was performed manually.

## Connect MetaMask and Use the DApp

1. Select the Ganache Local network in MetaMask.
2. Open the frontend and click **Connect MetaMask**.
3. Approve the connection request.
4. Use the deployment wallet to open **Issue**, enter a unique certificate ID, student name, and course, and confirm the transaction.
5. Open **Verify**, enter the same readable certificate ID, and select **Check blockchain**.
6. The interface displays the student, course, issue time, issuer, and active or revoked status retrieved from the contract.
7. Use **Revoke** from the owner wallet to revoke an existing record.

## Test Cases and Results

| ID | Input and actor | Expected result | Observed result |
|---|---|---|---|
| T1 | Owner issues `CERT-2026-001` with complete student and course data | Transaction succeeds and certificate can be retrieved | Passed; transaction succeeded and blockchain data was returned |
| T2 | Owner submits an empty student name | Transaction is rejected | Passed; reverted with `Student name cannot be empty` |
| T3 | Owner reuses an existing certificate ID | Transaction is rejected | Passed; reverted with `Certificate already exists` |
| T4 | Non-owner attempts to issue a certificate | Transaction is rejected | Passed; reverted with `Only the institution owner can perform this action` |
| T5 | Owner revokes an existing certificate | Transaction succeeds and status becomes revoked | Passed |
| T6 | Owner attempts to revoke a missing certificate | Transaction is rejected | Passed; reverted with `Certificate does not exist` |

Run all automated tests with:

```bash
npm test
```

The verified result is **6 passing and 0 failing**. Detailed results are stored in `evidence/test-results.md`, and the demonstration transaction data is stored in `evidence/transaction-evidence.json`.

## Screenshot Evidence

The `evidence/screenshots` folder contains:

1. Smart contract compilation
2. Smart contract deployment
3. MetaMask integration implementation
4. Successful blockchain transaction
5. Failed transaction
6. Blockchain data displayed through the interface

The available Chrome profile did not contain the MetaMask extension, so a live connected-wallet screenshot could not be captured automatically. After installing MetaMask, connect the Ganache owner account and replace `03-metamask-integration.png` with a screenshot showing the connected wallet status.

## Security Notice

Never commit or upload real private keys, seed phrases, passwords, API keys, or other credentials. Ganache accounts are disposable local test accounts, but their keys are intentionally omitted from this repository.
