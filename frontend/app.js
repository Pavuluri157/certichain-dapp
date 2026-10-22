let provider;
let signer;
let contract;
let readOnlyContract;

const config = window.CERTICHAIN_CONFIG;
const elements = {
  connectButton: document.getElementById("connectButton"),
  walletStatus: document.getElementById("walletStatus"),
  statusDot: document.getElementById("statusDot"),
  networkName: document.getElementById("networkName"),
  contractAddress: document.getElementById("contractAddress"),
  certificateCount: document.getElementById("certificateCount"),
  result: document.getElementById("certificateResult"),
  toast: document.getElementById("toast")
};

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab, .panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

elements.connectButton.addEventListener("click", connectWallet);
document.getElementById("verifyForm").addEventListener("submit", verifyCertificate);
document.getElementById("issueForm").addEventListener("submit", issueCertificate);
document.getElementById("revokeForm").addEventListener("submit", revokeCertificate);

async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("MetaMask is not installed in this browser.");
    if (!config || !ethers.isAddress(config.address)) throw new Error("Deploy the contract and update config.js first.");

    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(config.address, config.abi, signer);

    const account = await signer.getAddress();
    const network = await provider.getNetwork();
    elements.walletStatus.textContent = shorten(account);
    elements.connectButton.textContent = "Wallet connected";
    elements.statusDot.classList.add("connected");
    elements.networkName.textContent = `${network.name === "unknown" ? "Local Ganache" : network.name} (${network.chainId})`;
    elements.contractAddress.textContent = shorten(config.address);
    await refreshCount();
    showToast("MetaMask connected successfully.");
  } catch (error) {
    showToast(readError(error), true);
  }
}

async function initialiseReadOnlyAccess() {
  try {
    if (!config || !ethers.isAddress(config.address) || !config.abi.length) return;
    const rpcProvider = new ethers.JsonRpcProvider(config.rpcUrl || "http://127.0.0.1:7545");
    readOnlyContract = new ethers.Contract(config.address, config.abi, rpcProvider);
    const network = await rpcProvider.getNetwork();
    elements.networkName.textContent = `Local Ganache (${network.chainId})`;
    elements.contractAddress.textContent = shorten(config.address);
    elements.certificateCount.textContent = (await readOnlyContract.certificateCount()).toString();
  } catch (_error) {
    elements.networkName.textContent = "Ganache unavailable";
  }
}

async function verifyCertificate(event) {
  event.preventDefault();
  try {
    const lookupContract = contract || readOnlyContract;
    if (!lookupContract) throw new Error("Connect MetaMask or start the configured Ganache network.");
    const rawId = document.getElementById("verifyId").value.trim();
    if (!rawId) throw new Error("Enter a certificate ID.");
    const certificate = await lookupContract.getCertificate(ethers.id(rawId));
    if (!certificate.exists) {
      elements.result.className = "result empty";
      elements.result.textContent = "No certificate exists for this ID.";
      return;
    }

    const status = certificate.revoked ? "Revoked certificate" : "Valid certificate";
    elements.result.className = `result${certificate.revoked ? " revoked" : ""}`;
    elements.result.innerHTML = `
      <span class="badge">${status}</span>
      <div class="result-grid">
        <div><span>Student</span><strong>${escapeHtml(certificate.studentName)}</strong></div>
        <div><span>Course</span><strong>${escapeHtml(certificate.courseName)}</strong></div>
        <div><span>Issued</span><strong>${new Date(Number(certificate.issuedAt) * 1000).toLocaleString()}</strong></div>
        <div><span>Issuer</span><strong>${shorten(certificate.issuer)}</strong></div>
        <div><span>Certificate ID</span><strong>${escapeHtml(rawId)}</strong></div>
        <div><span>On-chain status</span><strong>${certificate.revoked ? "REVOKED" : "ACTIVE"}</strong></div>
      </div>`;
  } catch (error) {
    showToast(readError(error), true);
  }
}

async function issueCertificate(event) {
  event.preventDefault();
  try {
    requireContract();
    const id = document.getElementById("issueId").value.trim();
    const student = document.getElementById("studentName").value.trim();
    const course = document.getElementById("courseName").value.trim();
    if (!id || !student || !course) throw new Error("Complete all certificate fields.");

    showToast("Confirm the transaction in MetaMask…");
    const transaction = await contract.issueCertificate(ethers.id(id), student, course);
    await transaction.wait();
    event.target.reset();
    await refreshCount();
    showToast(`Certificate issued. Transaction: ${shorten(transaction.hash)}`);
  } catch (error) {
    showToast(readError(error), true);
  }
}

async function revokeCertificate(event) {
  event.preventDefault();
  try {
    requireContract();
    const id = document.getElementById("revokeId").value.trim();
    if (!id) throw new Error("Enter a certificate ID.");

    showToast("Confirm the revocation in MetaMask…");
    const transaction = await contract.revokeCertificate(ethers.id(id));
    await transaction.wait();
    event.target.reset();
    showToast(`Certificate revoked. Transaction: ${shorten(transaction.hash)}`);
  } catch (error) {
    showToast(readError(error), true);
  }
}

async function refreshCount() {
  elements.certificateCount.textContent = (await contract.certificateCount()).toString();
}

function requireContract() {
  if (!contract) throw new Error("Connect MetaMask before using the DApp.");
}

function shorten(value) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function readError(error) {
  const reason = error?.reason || error?.shortMessage || error?.info?.error?.message || error?.message || "Transaction failed.";
  return reason.replace("execution reverted: ", "");
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
}

let toastTimer;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = isError ? "show error" : "show";
  toastTimer = setTimeout(() => { elements.toast.className = ""; }, 5000);
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

initialiseReadOnlyAccess();
