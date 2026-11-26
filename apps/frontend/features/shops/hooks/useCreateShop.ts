"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateShopInput } from "@repo/contracts";
import { createShop } from "../api/shop.api";
import { shopKeys } from "./useShops";

/**
 * Registers a shop. On success every cached shop list is marked out of date, so the lists on
 * screen refresh by themselves. The form shows its own messages, so errors are not toasted here.
 */
export function useCreateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShopInput) => createShop(input),
    meta: { silent: true },
    onSuccess: () => {
      // Not awaited: the form should close right away while the lists refresh in the background.
      void queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
    },
  });
}
