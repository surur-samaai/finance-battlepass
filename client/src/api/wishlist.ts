import { apiClient } from "./client";
import type {
  WishlistResponse,
  RedeemValidateResponse,
  ConfirmRedeemResponse,
} from "./types";

export async function fetchWishlist(userId: number): Promise<WishlistResponse> {
  const { data } = await apiClient.get<WishlistResponse>(`/api/user/${userId}/wishlist`);
  return data;
}

export async function redeemItem(
  userId: number,
  itemId: number
): Promise<RedeemValidateResponse> {
  const { data } = await apiClient.post<RedeemValidateResponse>(
    `/api/user/${userId}/wishlist/${itemId}/redeem`
  );
  return data;
}

export async function confirmRedeem(
  userId: number,
  itemId: number
): Promise<ConfirmRedeemResponse> {
  const { data } = await apiClient.post<ConfirmRedeemResponse>(
    `/api/user/${userId}/wishlist/${itemId}/confirm-redeem`
  );
  return data;
}
