import { useState, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {
  AptosWalletAdapterProvider,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import "./index.css"; // Ensure this is imported

// --- SDK CONFIG ---
const aptosConfig = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(aptosConfig);

// --- TYPE DEFINITIONS ---
type ToastInfo = {
  id: number;
  type: "success" | "error";
  message: string;
  txHash?: string;
};

// --- HELPER ICONS (as SVG components) ---
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 7V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13.5M15 13H22M22 13L19 10M22 13L19 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
// Reusing .spinner from CSS for consistency
const Spinner = () => <div className="spinner" style={{ border: '2px solid #0c1029', borderBottomColor: 'transparent'}}></div>;


// --- TOAST NOTIFICATION COMPONENT ---
function Toast({ info, onClose }: { info: ToastInfo; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const explorerUrl = `https://explorer.aptoslabs.com/txn/${info.txHash}?network=devnet`;

  return (
    <div className={`toast toast-${info.type}`}>
      <div className="toast-content">
        <p>{info.message}</p>
        {info.type === 'success' && info.txHash && (
          <span>
            Transaction successful.{' '}
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              View on Explorer
            </a>
          </span>
        )}
        {info.type === 'error' && <span>Please check the console for details.</span>}
      </div>
    </div>
  );
}


// --- MAIN TIP JAR COMPONENT ---
function TipJar() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // REPLACE THIS WITH YOUR REAL CONTRACT ADDRESS
  const contractAddress = "0x6826fe5466bc58a04a2abd14159456daa38a1c9981be60569cc1e264f2aef568";

  const addToast = (type: "success" | "error", message: string, txHash?: string) => {
    const newToast: ToastInfo = { id: Date.now(), type, message, txHash };
    setToasts(prev => [...prev, newToast]);
  };

  const handleSendTip = async () => {
    if (!connected || !account) {
      addToast("error", "Please connect your wallet first.");
      return;
    }
    const trimmedAmount = amount.trim();
    if (!trimmedAmount || Number(trimmedAmount) <= 0) {
      addToast("error", "Please enter a valid positive amount.");
      return;
    }

    setIsSending(true);

    try {
      const amountInOcta = BigInt(Math.floor(Number(trimmedAmount) * 1e8));
      const transaction: InputTransactionData = {
        data: {
          function: `${contractAddress}::tip_jar::send_tip`,
          functionArguments: [contractAddress, amountInOcta.toString()],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      addToast("success", "Tip Sent Successfully!", response.hash);
      setAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
      addToast("error", "Transaction Failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="tip-jar-card">
        {!connected || !account ? (
          <p className="connection-prompt">Please connect your wallet to send a tip.</p>
        ) : (
          <>
            <div className="wallet-info">
              <WalletIcon />
              <span>
                {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
              </span>
            </div>

            <div className="form-group">
              <input
                type="number"
                placeholder="Enter amount in APT"
                className="tip-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSending}
              />
              <button  onClick={handleSendTip} disabled={isSending || !amount} className="tip-button">
                {isSending ? <Spinner /> : "Send Tip"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} info={toast} onClose={() => setToasts(ts => ts.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </>
  );
}


// --- APP WRAPPER WITH LOADING ANIMATION ---
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    // Simulate initial loading time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      // Give a small delay after loading screen disappears before content animates in
      const revealTimer = setTimeout(() => {
        setIsContentVisible(true);
      }, 200);
      return () => clearTimeout(revealTimer);
    }, 2000); // Adjust this duration for the initial glow spinner display

    return () => clearTimeout(loadingTimer);
  }, []);

  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{ network: Network.DEVNET }}
      optInWallets={["Petra"]}
    >
      <div className="app-container-wrapper">
        {isLoading && (
          <div className="loading-overlay">
            <div className="glow-spinner"></div>
          </div>
        )}

        <div className={`app-container ${isContentVisible ? 'visible' : ''}`}>
          <header className="app-header">
            <h1>Aptos Tip Jar 🚀</h1>
            <WalletSelector />
          </header>
          <main>
            <TipJar />
          </main>
        </div>
      </div>
    </AptosWalletAdapterProvider>
  );
}

export default App;