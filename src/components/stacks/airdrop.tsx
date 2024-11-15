import { BitcoinNetworkType, request } from "sats-connect";

import {
  AnchorMode,
  listCV,
  makeContractCall,
  PostConditionMode,
  stringUtf8CV,
} from "@stacks/transactions";

import nakamotoAirdrop from "./xverse_nakamoto_airdrop.json";

import { openContractCall } from "@stacks/connect";
import { useEffect, useState } from "react";

const AIRDROP_CONTRACT =
  "SP3F7GQ48JY59521DZEE6KABHBF4Q33PEYJ823ZXQ";
const CONTRACT_NAME = "xverse-nakamoto";
function splitArray<T>(array: T[], maxLength: number): [T[], T[]] {
  const firstArray = array.slice(0, maxLength);
  const secondArray = array.slice(maxLength, maxLength * 2);
  return [firstArray, secondArray];
}

type Props = {
  network: BitcoinNetworkType;
};

function Airdrop({ network }: Props) {
  const [airdropAddresses, setAirdropAddresses] = useState<string[]>([]);

  useEffect(() => {
    const addresses = nakamotoAirdrop.map(
      (item: any) => Object.values(item)[0]
    );
    setAirdropAddresses(addresses as any);
  }, []);
  const handleWebBtcCallContractClick = async () => {
    const [firstChunk, secondChunk] = splitArray(airdropAddresses, 4999);
    const addressList1 = listCV(
      firstChunk.map((address) => stringUtf8CV(address))
    );
    const addressList2 = listCV(
      secondChunk.map((address) => stringUtf8CV(address))
    );
    openContractCall({
      network: network === BitcoinNetworkType.Mainnet ? "mainnet" : "testnet",
      anchorMode: AnchorMode.Any,

      contractAddress: AIRDROP_CONTRACT,
      contractName: CONTRACT_NAME,
      functionName: "airdrop",
      functionArgs: [addressList1, addressList2, listCV([])],
      postConditionMode: PostConditionMode.Allow, // whether the tx should fail when unexpected assets are transferred
      onFinish: (response) => {
        // WHEN user confirms pop-up
        console.log(response);
      },
      onCancel: () => {
        // WHEN user cancels/closes pop-up
      },
    });
  };

  return (
    <div className="container">
      <h3>Call contract</h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <label>
          <div>Contract name:</div>
          <div>{AIRDROP_CONTRACT}.{CONTRACT_NAME}</div>
        </label>
        <button onClick={handleWebBtcCallContractClick}>
          Mint Airdrop Tokens
        </button>
      </div>
    </div>
  );
}

export default Airdrop;
