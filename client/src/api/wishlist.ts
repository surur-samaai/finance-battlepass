import { apiClient } from "./client";
import type {
  WishlistResponse,
  RedeemValidateResponse,
  ConfirmRedeemResponse,
  AddWishlistItemPayload,
  DeleteWishlistItemResponse,
} from "./types";
import type { WishlistItem } from "../types";

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

export async function addWishlistItem(
  userId: number,
  payload: AddWishlistItemPayload
): Promise<WishlistItem> {
  const { data } = await apiClient.post<WishlistItem>(
    `/api/user/${userId}/wishlist`,
    payload
  );
  return data;
}

export async function deleteWishlistItem(
  userId: number,
  itemId: number
): Promise<DeleteWishlistItemResponse> {
  const { data } = await apiClient.delete<DeleteWishlistItemResponse>(
    `/api/user/${userId}/wishlist/${itemId}`
  );
  return data;
}
