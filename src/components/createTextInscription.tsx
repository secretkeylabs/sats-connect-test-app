import { useState } from "react";
import { BitcoinNetworkType, createTextInscription } from "sats-connect";

type Props = {
  network: BitcoinNetworkType;
};

const CreateTextInscription = ({ network }: Props) => {
  const [content, setContent] = useState<string>(
    `<html>
    <body style='display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%'>
      <p>Hello World!</p>
      <p>I am recursive!!</p>
      <img src='/content/6fb976ab49dcec<html>
      <body
        style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
        "
      >
        <p>Hello World!</p>
        <p>I am recursive!!</p>
        <img
          src="/content/6fb976ab49dcec017f1e201e84395983204ae1a7c2abf7ced0a85d692e442799i0"
        />
        <div id="content">Fetching current block height...</div>
        <script>
          const fetchBlockheight = () =>
            fetch("/blockheight")
              .then((response) => response.text())
              .then((data) => {
                document.getElementById("content").textContent =
                  "Current block height: " + data;
              })
              .catch(console.error);
          setTimeout(fetchBlockheight, 2000);
        </script>
      </body>
    </html>
    017f1e201e84395983204ae1a7c2abf7ced0a85d692e442799i0' />
      <p>Current block height: <object data='/blockheight' /></p>
    </body>
  </html>
`
  );
  const [contentType, setContentType] = useState<string>("text/html");
  const onCreateClick = async () => {
    try {
      await createTextInscription({
        payload: {
          network: {
            type: network,
          },
          contentType,
          text: content,
          /** Optional parameters:
          feeAddress, // the address where the inscription fee should go
          inscriptionFee: 1000 // the amount of sats that should be sent to the fee address
          */
        },
        onFinish: (response) => {
          alert(response.txId);
        },
        onCancel: () => alert("Canceled"),
      });
    } catch (error) {
      alert(`An error ocurred: ${error.message}`);
    }
  };

  if (network !== BitcoinNetworkType.Mainnet) {
    return (
      <div className="container">
        <h3>Create text inscription</h3>
        <b>This is only available in Mainnet</b>
      </div>
    );
  }

  return (
    <div className="container">
      <h3>Create text inscription</h3>
      <p>
        Creates an inscription with the desired text and content type. The
        inscription will be sent to your ordinals address.
      </p>
      <p>
        A service fee and service fee address can be added to the inscription
        request as part of the payload if desired.
      </p>
      <div>
        <p>
          <b>Content type</b>
          <br />
          <input
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          />
        </p>
        <p>
          <b>Content</b>
          <br />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </p>
        <button onClick={onCreateClick}>Create inscription</button>
      </div>
    </div>
  );
};

export default CreateTextInscription;