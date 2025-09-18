"use client";
import { useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  Hex,
  http,
} from "viem";
import { arbitrum} from "viem/chains";
import { useSign7702Authorization, useWallets } from "@privy-io/react-auth";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  getEntryPoint,
  KERNEL_V3_3,
  KernelVersionToAddressesMap,
} from "@zerodev/sdk/constants";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getUserOperationGasPrice,
} from "@zerodev/sdk";

const ZERODEV_RPC = process.env.NEXT_PUBLIC_PAYMASTER_RPC;
const chain = arbitrum;
const kernelVersion = KERNEL_V3_3;
const entryPoint = getEntryPoint("0.7");
const publicClient = createPublicClient({ chain, transport: http() });

type KernelAccount = Awaited<ReturnType<typeof createKernelAccount>>;
type KernelClient = ReturnType<typeof createKernelAccountClient>;

export function useZeroDevKernel() {
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();
  const [account, setAccount] = useState<KernelAccount | null>(null);
  const [kernelClient, setKernelClient] = useState<KernelClient | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const embeddedWallet = useMemo(
    () => wallets.find((w) => w.walletClientType === "privy"),
    [wallets]
  );
  console.log("🚀 ~ useZeroDevKernel ~ embeddedWallet:", embeddedWallet)

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!embeddedWallet) {
        console.debug("useZeroDevKernel: no embedded wallet yet");
        return;
      }

      if (!signAuthorization) {
        console.debug("useZeroDevKernel: signAuthorization not ready");
        return;
      }

      if (!ZERODEV_RPC) {
        setError(new Error("NEXT_PUBLIC_PAYMASTER_RPC is not set"));
        return;
      }

      setInitializing(true);
      setError(null);

      try {
        console.debug("useZeroDevKernel: starting initialization", {
          embeddedWalletAddress: embeddedWallet.address,
        });

        const provider = await embeddedWallet.getEthereumProvider();
        if (!provider)
          throw new Error(
            "embeddedWallet.getEthereumProvider() returned undefined"
          );

        const walletClient = createWalletClient({
          account: embeddedWallet.address as Hex,
          chain,
          transport: custom(provider),
        });

        // Request 7702 authorization signed by the embedded wallet
        const authorization = await signAuthorization({
          contractAddress:
            KernelVersionToAddressesMap[kernelVersion]
              .accountImplementationAddress,
          chainId: chain.id,
        });

        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient,
          entryPoint,
          kernelVersion,
        });

        const createdAccount = await createKernelAccount(publicClient, {
          plugins: { sudo: ecdsaValidator },
          entryPoint,
          kernelVersion,
          address: walletClient.account.address,
          eip7702Auth: authorization,
        });

        const paymasterClient = createZeroDevPaymasterClient({
          chain,
          transport: http(ZERODEV_RPC),
        });

        const createdKernelClient = createKernelAccountClient({
          account: createdAccount,
          chain,
          bundlerTransport: http(ZERODEV_RPC),
          paymaster: paymasterClient,
          client: publicClient,
          userOperation: {
            estimateFeesPerGas: async ({ bundlerClient }) => {
              return getUserOperationGasPrice(bundlerClient);
            },
          },
        });
        console.log(
          "🚀 ~ init ~ createdKernelClient:",
          createdKernelClient.account.address
        );

        if (!mounted) return;

        console.debug("useZeroDevKernel: created kernel client", {
          accountAddress: createdAccount.address,
        });

        setAccount(createdAccount);
        setKernelClient(createdKernelClient);
      } catch (err) {
        console.error("useZeroDevKernel init error:", err);
        if (!mounted) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [embeddedWallet, embeddedWallet?.address, signAuthorization]); // more specific deps

  return {
    account,
    kernelClient,
    initializing,
    error,
    chain,
    publicClient,
  } as const;
}

export type UseZeroDevKernelResult = ReturnType<typeof useZeroDevKernel>;
