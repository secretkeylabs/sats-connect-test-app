import { useState } from "react";
import type { Capability } from "sats-connect";
import Wallet, {
  BitcoinNetworkType,
  RpcErrorCode,
  signMessage,
} from "sats-connect";

type Props = {
  network: BitcoinNetworkType;
  address: string;
  capabilities: Set<Capability>;
};

const SignMessage = ({ network, address, capabilities }: Props) => {
  const [message, setMessage] = useState("Hello World!");

  const onSignMessageClick = async () => {
    if (!address) return alert("Address is required");

    await signMessage({
      payload: {
        network: {
          type: network,
        },
        address,
        message,
      },
      onFinish: (response) => {
        alert(response);
      },
      onCancel: () => alert("Canceled Message Signing Request"),
    });
  };

  const onSignMessageRpcClick = async () => {
    try {
      const response = await Wallet.request("signMessage", {
        address,
        message,
      });
      if (response.status === "success") {
        console.log(response);
        alert(response.result.signature);
      } else {
        const error = response;
        console.log(error);
        if (error.error.code === RpcErrorCode.USER_REJECTION) {
          alert("Canceled");
        } else {
          alert(error.error.message);
        }
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  if (!capabilities.has("signMessage")) {
    return (
      <div className="container">
        <h3>Sign message</h3>
        <b>The wallet does not support this feature</b>
      </div>
    );
  }

  const signingDisabled = message.length === 0;

  return (
    <div className="container">
      <h3>Sign message</h3>
      <p>
        <b>Address</b>
        <br />
        {address}
      </p>
      <b>Message</b>
      <br />
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <br />
      <br />
      <div>
        <button onClick={onSignMessageClick} disabled={signingDisabled}>
          Sign message
        </button>
        <button onClick={onSignMessageRpcClick} disabled={signingDisabled}>
          Sign message RPC
        </button>
      </div>
    </div>
  );
};

export default SignMessage;
