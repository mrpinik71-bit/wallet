// EVM adapter: balances, ERC-20 reads and signed transfers.
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits, formatEther, isAddress, getAddress } from "ethers";
import { chains } from "@/lib/chains/config";
import { evmPrivateKey } from "@/lib/chains/derive";

const ERC20 = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
];

const providers = new Map();

export function provider(chainId) {
  if (!providers.has(chainId)) {
    const chain = chains[chainId];
    providers.set(chainId, new JsonRpcProvider(chain.rpc, chain.chainId, { staticNetwork: true }));
  }
  return providers.get(chainId);
}

export async function evmNativeBalance(chainId, address) {
  const value = await provider(chainId).getBalance(address);
  return Number(formatUnits(value, 18));
}

export async function evmTokenBalance(chainId, address, coin) {
  const contract = new Contract(coin.address, ERC20, provider(chainId));
  const value = await contract.balanceOf(address);
  return Number(formatUnits(value, coin.decimals));
}

export async function evmFee({ chainId, coin, from, to, amount }) {
  const rpc = provider(chainId);
  const feeData = await rpc.getFeeData();
  const price = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  let gas = coin.kind === "token" ? 65000n : 21000n;
  try {
    gas = await rpc.estimateGas({
      from,
      to: coin.kind === "token" ? coin.address : to,
      value: coin.kind === "token" ? 0n : parseUnits(String(amount || "0"), 18),
    });
  } catch {
    // keep the conservative default when the node cannot estimate
  }
  return Number(formatEther(gas * price));
}

export async function evmSend({ chainId, coin, mnemonic, to, amount }) {
  if (!isAddress(to)) throw new Error(`That is not a valid ${chains[chainId].name} address.`);
  const wallet = new Wallet(evmPrivateKey(mnemonic), provider(chainId));
  const target = getAddress(to);

  if (coin.kind === "token") {
    const contract = new Contract(coin.address, ERC20, wallet);
    const tx = await contract.transfer(target, parseUnits(String(amount), coin.decimals));
    return tx.hash;
  }

  const tx = await wallet.sendTransaction({ to: target, value: parseUnits(String(amount), 18) });
  return tx.hash;
}