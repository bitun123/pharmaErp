"use client";

import * as React from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import Link from "next/link";
import { AlertCircle, AtSign, Hash, KeyRound, Loader2, Store, User } from "lucide-react";
import { ImagePicker } from "@/components/common/image-picker";
import { FormInput } from "@/components/fromInput/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useCreateShop } from "../hooks/useCreateShop";
import { useLogoUpload } from "../hooks/useLogoUpload";
import {
  REGISTER_SHOP_DEFAULTS,
  REGISTER_SHOP_LIMITS,
  isRegisterShopFormFilled,
  registerShop,
  registerShopResolver,
  registeredMessage,
  SHOP_LOGO_FOLDER,
  type RegisterShopField,
  type RegisterShopFormValues,
} from "../store/register-shop-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SectionTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {text && <p className="text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * "Register New Shop" form in a right-hand sheet. Fields are handled by react-hook-form and
 * validated with the shared createShopSchema (the same rules the backend uses).
 * Submitting registers the shop with the logo's file id. Backend refusals show up on the right
 * field, or as a banner at the top when no single field is to blame.
 */
export function ShopRegisterSheet({ open, onOpenChange }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterShopFormValues>({
    resolver: registerShopResolver as unknown as Resolver<RegisterShopFormValues>,
    defaultValues: REGISTER_SHOP_DEFAULTS,
    mode: "onTouched",
  });

  // The logo is uploaded as soon as it is picked. The returned file id goes into the form,
  // and is what the shop is registered with.
  const logo = useLogoUpload({
    folder: SHOP_LOGO_FOLDER,
    onFileIdChange: (fileId) => setValue("logoFileId", fileId ?? "", { shouldValidate: true }),
  });

  const createShop = useCreateShop();
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);
  const [formError, setFormError] = React.useState<{ message: string; signIn: boolean } | null>(null);
  const addressLength = useWatch({ control, name: "address" }).length;

  const closeNow = () => {
    setConfirmingDiscard(false);
    setFormError(null);
    logo.remove(); // cancels a running upload and deletes an uploaded logo that was never saved
    reset(REGISTER_SHOP_DEFAULTS);
    onOpenChange(false);
  };

  // The X button, Esc and a click outside all end up here. Typed data is never thrown away silently.
  const requestClose = () => {
    if (isSubmitting) return;
    if (isRegisterShopFormFilled(getValues()) || logo.file) setConfirmingDiscard(true);
    else closeNow();
  };

  const onSubmit = async (values: RegisterShopFormValues) => {
    setFormError(null);
    if (logo.blocksSubmit) return; // the button is disabled too; this covers pressing Enter in a field

    const result = await registerShop(values, createShop.mutateAsync);

    if (result.ok) {
      logo.markSaved(); // the shop owns the file now, so closing must not delete it
      toast.add({ type: "success", ...registeredMessage(result.response) });
      closeNow();
      return;
    }

    // Everything the user typed stays, and an uploaded logo is not uploaded again.
    const { failure } = result;
    const fields = Object.entries(failure.fieldErrors) as [RegisterShopField, string][];
    fields.forEach(([field, message], index) => setError(field, { type: "server", message }, { shouldFocus: index === 0 }));
    setFormError(failure.formError ? { message: failure.formError, signIn: failure.signIn } : null);
    if (failure.clearLogo) logo.remove();
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <SheetContent
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        aria-label="Register New Shop"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-border px-4 py-4 pr-14 sm:px-6">
            <SheetTitle className="text-base font-semibold">Register New Shop</SheetTitle>
            <SheetDescription>Add a pharmacy and the person who will manage it.</SheetDescription>
          </SheetHeader>

          {formError && (
            <div
              role="alert"
              className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive sm:mx-6"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1">
                {formError.message}
                {formError.signIn && (
                  <>
                    {" "}
                    <Link href="/signin" className="font-medium underline">
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
            {/* ---- Shop ---- */}
            <section className="space-y-4">
              <SectionTitle title="Shop details" />

              <FormInput
                label="Shop name"
                required
                autoFocus
                autoComplete="off"
                placeholder="Central Pharmacy Branch 1"
                maxLength={REGISTER_SHOP_LIMITS.name}
                disabled={isSubmitting}
                leftIcon={<Store className="size-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              <FormInput
                label="Slug"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="central-pharmacy-branch-1"
                maxLength={REGISTER_SHOP_LIMITS.slug}
                disabled={isSubmitting}
                leftIcon={<Hash className="size-4" />}
                helperText="Optional. Lowercase letters, numbers and hyphens. Leave empty to create it from the shop name."
                error={errors.slug?.message}
                {...register("slug")}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-medium">
                  <Label htmlFor="shop-address">Address</Label>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {addressLength}/{REGISTER_SHOP_LIMITS.address}
                  </span>
                </div>
                <Textarea
                  id="shop-address"
                  rows={3}
                  autoComplete="off"
                  placeholder="Street, area, city"
                  maxLength={REGISTER_SHOP_LIMITS.address}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.address)}
                  className="min-h-20 resize-none"
                  {...register("address")}
                />
                {errors.address?.message && (
                  <p role="alert" className="text-[11px] font-medium text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Logo</Label>
                <ImagePicker
                  file={logo.file}
                  status={logo.status}
                  error={logo.error}
                  canRetry={logo.canRetry}
                  onPick={logo.pick}
                  onRemove={logo.remove}
                  onRetry={logo.retry}
                  disabled={isSubmitting}
                  label="Add a shop logo"
                />
                {logo.status === "error" && (
                  <p className="text-[11px] text-muted-foreground">Retry or remove the logo to continue.</p>
                )}
                {errors.logoFileId?.message && (
                  <p role="alert" className="text-[11px] font-medium text-destructive">{errors.logoFileId.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="shop-active">Shop is active</Label>
                  <p className="text-xs text-muted-foreground">Blocked shops cannot sign in or be used.</p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="shop-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      aria-label="Shop is active"
                    />
                  )}
                />
              </div>
            </section>

            <hr className="border-border" />

            {/* ---- Administrator ---- */}
            <section className="space-y-4">
              <SectionTitle title="Shop administrator" text="This person manages the shop and signs in with the email below." />

              <FormInput
                label="Admin name"
                required
                autoComplete="off"
                placeholder="Aarav Sharma"
                maxLength={REGISTER_SHOP_LIMITS.adminName}
                disabled={isSubmitting}
                leftIcon={<User className="size-4" />}
                error={errors.adminName?.message}
                {...register("adminName")}
              />

              <FormInput
                label="Admin email"
                type="email"
                required
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                placeholder="aarav@example.com"
                disabled={isSubmitting}
                leftIcon={<AtSign className="size-4" />}
                error={errors.adminEmail?.message}
                {...register("adminEmail")}
              />

              <FormInput
                label="Admin password"
                type="password"
                // "new-password" stops the browser from filling in the Super Admin's own saved password.
                autoComplete="new-password"
                placeholder="At least 8 characters"
                maxLength={REGISTER_SHOP_LIMITS.password}
                disabled={isSubmitting}
                leftIcon={<KeyRound className="size-4" />}
                helperText="Optional. Leave empty and the admin gets an email link to choose their own password. If you set one, it is emailed to them."
                error={errors.adminPassword?.message}
                {...register("adminPassword")}
              />
            </section>
          </div>

          <div className="border-t border-border bg-popover px-4 py-3 sm:px-6">
            {confirmingDiscard ? (
              <div role="alertdialog" aria-label="Discard changes?" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Discard what you entered?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => setConfirmingDiscard(false)}>
                    Keep editing
                  </Button>
                  <Button type="button" variant="destructive" className="h-10 flex-1 sm:flex-none" onClick={closeNow}>
                    Discard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" className="h-10 flex-1 sm:flex-none sm:px-5" onClick={requestClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="h-10 flex-1 gap-2 sm:flex-none sm:px-5" disabled={isSubmitting || logo.blocksSubmit}>
                  {(isSubmitting || logo.status === "uploading") && <Loader2 className="size-4 animate-spin" />}
                  {logo.status === "uploading" ? "Uploading logo..." : "Register Shop"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
