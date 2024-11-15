import type { Capability } from "sats-connect";
import Wallet, {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
  getProviders,
} from "sats-connect";

import CreateFileInscription from "./components/createFileInscription";
import CreateTextInscription from "./components/createTextInscription";
import SendBitcoin from "./components/sendBitcoin";
import SignMessage from "./components/signMessage";
import SignTransaction from "./components/signTransaction";

// Stacks
import StxCallContract from "./components/stacks/callContract";
import StxDeployContract from "./components/stacks/deployContract";
import StxGetAccounts from "./components/stacks/getAccounts";
import StxGetAddresses from "./components/stacks/getAddresses";
import StxSignMessage from "./components/stacks/signMessage";
import StxSignStructuredMessage from "./components/stacks/signStructuredMessage";
import StxSignTransaction from "./components/stacks/signTransaction";
import StxTransferStx from "./components/stacks/transferStx";

import { useLocalStorage } from "./useLocalStorage";

import { useEffect, useMemo, useState } from "react";
import "./App.css";
import CreateRepeatInscriptions from "./components/createRepeatInscriptions";
import SignBulkTransaction from "./components/signBulkTransaction";
import GetRunesBalance from "./components/getRuneBalance";
import Airdrop from "./components/stacks/airdrop";
import { AppConfig, showConnect, UserSession } from "@stacks/connect";

function App() {
  const [paymentAddress, setPaymentAddress] = useLocalStorage("paymentAddress");
  const [paymentPublicKey, setPaymentPublicKey] =
    useLocalStorage("paymentPublicKey");
  const [ordinalsAddress, setOrdinalsAddress] =
    useLocalStorage("ordinalsAddress");
  const [ordinalsPublicKey, setOrdinalsPublicKey] =
    useLocalStorage("ordinalsPublicKey");
  const [stacksAddress, setStacksAddress] = useLocalStorage("stacksAddress");
  const [stacksPublicKey, setStacksPublicKey] =
    useLocalStorage("stacksPublicKey");
  const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>(
    "network",
    BitcoinNetworkType.Testnet
  );
  const [capabilityState, setCapabilityState] = useState<
    "loading" | "loaded" | "missing" | "cancelled"
  >("loading");
  const [capabilities, setCapabilities] = useState<Set<Capability>>();
  const providers = useMemo(() => getProviders(), []);

  useEffect(() => {
    const runCapabilityCheck = async () => {
      let runs = 0;
      const MAX_RUNS = 20;
      setCapabilityState("loading");

      // the wallet's in-page script may not be loaded yet, so we'll try a few times
      while (runs < MAX_RUNS) {
        try {
          await getCapabilities({
            onFinish(response) {
              setCapabilities(new Set(response));
              setCapabilityState("loaded");
            },
            onCancel() {
              setCapabilityState("cancelled");
            },
            payload: {
              network: {
                type: network,
              },
            },
          });
        } catch (e) {
          runs++;
          if (runs === MAX_RUNS) {
            setCapabilityState("missing");
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    runCapabilityCheck();
  }, [network]);

  const isReady =
    !!capabilities &&
    !!paymentAddress &&
    !!paymentPublicKey &&
    !!ordinalsAddress &&
    !!ordinalsPublicKey;

  const onWalletDisconnect = () => {
    Wallet.disconnect();
    setPaymentAddress(undefined);
    setPaymentPublicKey(undefined);
    setOrdinalsAddress(undefined);
    setOrdinalsPublicKey(undefined);
    setStacksAddress(undefined);
  };

  const handleGetInfo = async () => {
    try {
      const response = await Wallet.request("getInfo", null);

      if (response.status === "success") {
        alert("Success. Check console for response");
        console.log(response.result);
      } else {
        alert("Error getting info. Check console for error logs");
        console.error(response.error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const toggleNetwork = () => {
    setNetwork(
      network === BitcoinNetworkType.Testnet
        ? BitcoinNetworkType.Mainnet
        : BitcoinNetworkType.Testnet
    );
    onWalletDisconnect();
  };

  const onConnectClick = async () => {
    await getAddress({
      payload: {
        purposes: [
          AddressPurpose.Ordinals,
          AddressPurpose.Payment,
          AddressPurpose.Stacks,
        ],
        message: "SATS Connect Demo",
        network: {
          type: network,
        },
      },
      onFinish: (response) => {
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment
        );
        setPaymentAddress(paymentAddressItem?.address);
        setPaymentPublicKey(paymentAddressItem?.publicKey);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals
        );
        setOrdinalsAddress(ordinalsAddressItem?.address);
        setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);

        const stacksAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Stacks
        );
        setStacksAddress(stacksAddressItem?.address);
        setStacksPublicKey(stacksAddressItem?.publicKey);
      },
      onCancel: () => alert("Request canceled"),
    });
  };

  const onConnectAccountClick = async () => {
    const response = await Wallet.request("getAccounts", {
      purposes: [
        AddressPurpose.Ordinals,
        AddressPurpose.Payment,
        AddressPurpose.Stacks,
      ],
      message: "SATS Connect Demo",
    });
    if (response.status === "success") {
      const paymentAddressItem = response.result.find(
        (address) => address.purpose === AddressPurpose.Payment
      );
      setPaymentAddress(paymentAddressItem?.address);
      setPaymentPublicKey(paymentAddressItem?.publicKey);

      const ordinalsAddressItem = response.result.find(
        (address) => address.purpose === AddressPurpose.Ordinals
      );
      setOrdinalsAddress(ordinalsAddressItem?.address);
      setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);

      const stacksAddressItem = response.result.find(
        (address) => address.purpose === AddressPurpose.Stacks
      );
      setStacksAddress(stacksAddressItem?.address);
      setStacksPublicKey(stacksAddressItem?.publicKey);
    } else {
      if (response.error) {
        alert("Error getting accounts. Check console for error logs");
        console.error(response.error);
      }
    }
  };

  const capabilityMessage =
    capabilityState === "loading"
      ? "Checking capabilities..."
      : capabilityState === "cancelled"
      ? "Capability check cancelled by wallet. Please refresh the page and try again."
      : capabilityState === "missing"
      ? "Could not find an installed Sats Connect capable wallet. Please install a wallet and try again."
      : !capabilities
      ? "Something went wrong with getting capabilities"
      : undefined;

  // if (capabilityMessage) {
  //   return (
  //     <div style={{ padding: 30 }}>
  //       <h1>Sats Connect Test App - {network}</h1>
  //       <div>{capabilityMessage}</div>
  //     </div>
  //   );
  // }

  const handleConnectStacks = async () => {
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    const userSession = new UserSession({ appConfig });
    const appDetails = {
      name: "Sats Connect Test App",
      icon: "",
     }
     
     showConnect({
      appDetails,
      userSession,
      onFinish: () => {
        window.location.reload();
      },
      onCancel: () => {
        console.log('oops');
      },
     });
   };

  if (!isReady) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Sats Connect Test App - {network}</h1>
        <div>Please connect your wallet to continue</div>
        <div style={{ background: "lightgray", padding: 30, marginTop: 10 }}>
          <button style={{ height: 30, width: 180 }} onClick={toggleNetwork}>
            Switch Network
          </button>
          <br />
          <br />
          <button style={{ height: 30, width: 180 }} onClick={onConnectClick}>
            Connect
          </button>
          <button
            style={{ height: 30, width: 180, marginLeft: 10 }}
            onClick={onConnectAccountClick}
          >
            Connect Account
          </button>
          <button
            style={{ height: 30, width: 180, marginLeft: 10 }}
            onClick={handleConnectStacks}
          >
            Connect Stacks
          </button>
          <Airdrop network={network} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Sats Connect Test App - {network}</h1>
      <div>
        <div>Payment Address: {paymentAddress}</div>
        <div>Payment PubKey: {paymentPublicKey}</div>
        <div>Ordinals Address: {ordinalsAddress}</div>
        <div>Ordinals PubKey: {ordinalsPublicKey}</div>
        <br />

        <div className="container">
          <h3>Disconnect wallet</h3>
          <button onClick={onWalletDisconnect}>Disconnect</button>
        </div>
        <div className="container">
          <h3>Get Wallet Info</h3>
          <button onClick={handleGetInfo}>Request Info</button>
        </div>
        <SignTransaction
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
        />

        <SignBulkTransaction
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
        />

        <SignMessage
          address={ordinalsAddress}
          network={network}
          capabilities={capabilities!}
        />

        <SendBitcoin
          address={paymentAddress}
          network={network}
          capabilities={capabilities!}
        />
        <GetRunesBalance />

        <CreateTextInscription network={network} capabilities={capabilities!} />

        <CreateRepeatInscriptions
          network={network}
          capabilities={capabilities!}
        />

        <CreateFileInscription network={network} capabilities={capabilities!} />
      </div>
      {stacksAddress && (
        <>
          <h2>Stacks</h2>
          <div>
            <p>Stacks Address: {stacksAddress}</p>
            <p>Stacks PubKey: {stacksPublicKey}</p>
            <br />
            <Airdrop network={network} />
            <StxGetAccounts />

            <StxGetAddresses />

            <StxTransferStx address={stacksAddress} />

            <StxSignTransaction
              network={network}
              publicKey={stacksPublicKey || ""}
            />

            <StxCallContract network={network} />

            <StxSignMessage network={network} />

            <StxSignStructuredMessage network={network} />

            <StxDeployContract network={network} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
