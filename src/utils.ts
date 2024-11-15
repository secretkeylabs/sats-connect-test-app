import { base64, hex } from "@scure/base";
import * as btc from "@scure/btc-signer";

import { BitcoinNetworkType } from "sats-connect";

export type UTXO = {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
};

export const getUTXOs = async (
  network: BitcoinNetworkType,
  address: string
): Promise<UTXO[]> => {
  const networkSubpath =
    network === BitcoinNetworkType.Testnet ? "/testnet" : "";

  const url = `https://mempool.space${networkSubpath}/api/address/${address}/utxo`;
  const response = await fetch(url);

  return response.json();
};

export const createPSBT = async (
  networkType: BitcoinNetworkType,
  paymentPublicKeyString: string,
  ordinalsPublicKeyString: string,
  paymentUnspentOutputs: UTXO[],
  ordinalsUnspentOutputs: UTXO[],
  recipient1: string,
  recipient2: string
) => {
  const network =
    networkType === BitcoinNetworkType.Testnet ? btc.TEST_NETWORK : btc.NETWORK;

  // choose first unspent output
  const paymentOutput = paymentUnspentOutputs[0];
  const ordinalOutput = ordinalsUnspentOutputs[0];

  const paymentPublicKey = hex.decode(paymentPublicKeyString);
  const ordinalPublicKey = hex.decode(ordinalsPublicKeyString);

  const tx = new btc.Transaction({
    allowUnknownOutputs: true,
  });

  // create segwit spend
  const p2wpkh = btc.p2wpkh(paymentPublicKey, network);
  const p2sh = btc.p2sh(p2wpkh, network);

  // create taproot spend
  const p2tr = btc.p2tr(ordinalPublicKey, undefined, network);

  // set transfer amount and calculate change
  const fee = 300n; // set the miner fee amount
  const recipient1Amount = BigInt(Math.min(paymentOutput.value, 3000)) - fee;
  const recipient2Amount = BigInt(Math.min(ordinalOutput.value, 3000));
  const total = recipient1Amount + recipient2Amount;
  const changeAmount =
    BigInt(paymentOutput.value) + BigInt(ordinalOutput.value) - total - fee;

  // payment input
  tx.addInput({
    txid: paymentOutput.txid,
    index: paymentOutput.vout,
    witnessUtxo: {
      script: p2sh.script ? p2sh.script : Buffer.alloc(0),
      amount: BigInt(paymentOutput.value),
    },
    redeemScript: p2sh.redeemScript ? p2sh.redeemScript : Buffer.alloc(0),
    witnessScript: p2sh.witnessScript,
    sighashType: btc.SignatureHash.SINGLE | btc.SignatureHash.ANYONECANPAY,
  });

  // ordinals input
  tx.addInput({
    txid: ordinalOutput.txid,
    index: ordinalOutput.vout,
    witnessUtxo: {
      script: p2tr.script,
      amount: BigInt(ordinalOutput.value),
    },
    tapInternalKey: ordinalPublicKey,
    sighashType: btc.SignatureHash.SINGLE | btc.SignatureHash.ANYONECANPAY,
  });

  tx.addOutputAddress(recipient1, recipient1Amount, network);
  tx.addOutputAddress(recipient2, recipient2Amount, network);
  tx.addOutputAddress(recipient2, changeAmount, network);

  tx.addOutput({
    script: btc.Script.encode([
      "HASH160",
      "DUP",
      new TextEncoder().encode("SP1KSN9GZ21F4B3DZD4TQ9JZXKFTZE3WW5GXREQKX"),
    ]),
    amount: 0n,
  });

  const psbt = tx.toPSBT(0);
  const psbtB64 = base64.encode(psbt);
  console.log(psbtB64);
  return psbtB64;
};
