"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { validateImageFile } from "@/lib/image-validation";
import type { ProductView } from "@/types/product";
import type { ProductFormValues } from "@/types/product-form";
import { emptyProductForm } from "@/types/product-form";
import { Modal } from "@/components/ui/Modal";
import { DeleteProductConfirm } from "./DeleteProductConfirm";
import type { BookingView } from "@/types/booking";
import { Button } from "@/components/ui/Button";
import type { CategoryView } from "@/types/category";
import type {
  BoostDuration,
  MonetizationRequestView,
} from "@/types/monetization";
import type { ExistingImage, MonetizationModalState } from "./types";
import { buildInvoiceState, getApiErrorMessage } from "./helpers";
import { InvoiceBox } from "./InvoiceBox";
import { MonetizationModal } from "./MonetizationModal";
import { ProductEditorSection } from "./ProductEditorSection";
import { BookingsSection } from "./BookingsSection";
import { ProductListSection } from "./ProductListSection";

type DashboardSection = "editor" | "manage" | "bookings";

type Props = {
  initialProducts: ProductView[];
  initialBookings: BookingView[];
  initialPickupAddress?: string;
  categories: CategoryView[];
  currentProductLimit: number;
  initialMonetizationRequests: MonetizationRequestView[];
  dashboardSection?: DashboardSection;
  onRequestEditorSection?: () => void;
};

const MAX_IMAGES = 10;

export function UserProductForm({
  initialProducts,
  initialBookings,
  initialPickupAddress = "",
  categories,
  currentProductLimit,
  initialMonetizationRequests,
  dashboardSection = "manage",
  onRequestEditorSection,
}: Props) {
  const router = useRouter();

  const [products, setProducts] = useState<ProductView[]>(initialProducts);
  const [form, setForm] = useState<ProductFormValues>({
    ...emptyProductForm,
    pickupAddress: initialPickupAddress,
  });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [productToDelete, setProductToDelete] = useState<ProductView | null>(
    null,
  );
  const [bookings, setBookings] = useState<BookingView[]>(initialBookings);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(
    null,
  );

  const [monetizationModal, setMonetizationModal] =
    useState<MonetizationModalState>({
      open: false,
      type: "boost_product",
      product: null,
    });

  const [monetizationMessage, setMonetizationMessage] = useState("");
  const [requestedLimitIncrease, setRequestedLimitIncrease] = useState(1);
  const [boostDuration, setBoostDuration] = useState<BoostDuration>("week");
  const [monetizationLoading, setMonetizationLoading] = useState(false);
  const [monetizationSuccess, setMonetizationSuccess] = useState("");
  const [monetizationInvoice, setMonetizationInvoice] =
    useState<MonetizationRequestView | null>(null);

  const totalImagesCount = existingImages.length + imageFiles.length;
  const isEditing = editingProductId !== null;
  const showEditorSection = dashboardSection === "editor";
  const showManageSection = dashboardSection === "manage";
  const showBookingsSection = dashboardSection === "bookings";

  const initialInvoiceState = useMemo(
    () => buildInvoiceState(initialMonetizationRequests),
    [initialMonetizationRequests],
  );

  const [activeLimitInvoice, setActiveLimitInvoice] =
    useState<MonetizationRequestView | null>(
      initialInvoiceState.activeLimitInvoice,
    );

  const [activeBoostInvoices, setActiveBoostInvoices] = useState<
    Record<string, MonetizationRequestView>
  >(initialInvoiceState.activeBoostInvoices);

  function storeActiveInvoice(invoice: MonetizationRequestView): void {
    if (invoice.type === "increase_limit") {
      setActiveLimitInvoice(invoice);
      return;
    }

    if (invoice.type === "boost_product" && invoice.productId) {
      setActiveBoostInvoices((prev) => ({
        ...prev,
        [invoice.productId as string]: invoice,
      }));
    }
  }

  function resetForm(): void {
    setEditingProductId(null);
    setExistingImages([]);
    setImageFiles([]);
    setPreviewUrls([]);
    setForm({ ...emptyProductForm, pickupAddress: initialPickupAddress });
    setError("");
  }

  function startEditing(product: ProductView): void {
    setError("");
    setEditingProductId(product._id ?? null);
    onRequestEditorSection?.();

    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      category: product.category as ProductFormValues["category"],

      short: product.short ?? "",
      fullDescription: product.fullDescription ?? "",

      organization: product.organization ?? "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      condition: product.condition ?? "good",

      depositBYN: product.depositBYN ?? 0,
      pricePerDayBYN: product.pricePerDayBYN ?? 0,
      pricePerWeekBYN: product.pricePerWeekBYN ?? 0,
      pricePerMonthBYN: product.pricePerMonthBYN ?? 0,
      minDays: product.minDays ?? 1,
      quantity: product.quantity ?? 1,

      city: product.city ?? "Могилёв",
      citySlug: product.citySlug ?? "mogilev",
      pickupAddress: product.pickupAddress ?? "",
      deliveryAvailable: product.deliveryAvailable ?? false,

      kitIncludedText: (product.kitIncluded ?? []).join("\n"),
      specificationsText: (product.specifications ?? [])
        .map((item) => `${item.label}: ${item.value}`)
        .join("\n"),
      faqText: (product.faq ?? [])
        .map((item) => `${item.q} || ${item.a}`)
        .join("\n"),
    });

    setExistingImages(
      (product.images ?? []).map((url, index) => ({
        url,
        publicId: product.imagePublicIds?.[index],
      })),
    );
    setImageFiles([]);
    setPreviewUrls([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    setError("");

    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...imageFiles, ...selectedFiles];
    const nextTotal = existingImages.length + nextFiles.length;

    if (nextTotal > MAX_IMAGES) {
      event.target.value = "";
      setError(`Можно загрузить не более ${MAX_IMAGES} изображений`);
      return;
    }

    for (const file of selectedFiles) {
      const validationError = await validateImageFile(file);

      if (validationError) {
        event.target.value = "";
        setError(`Файл "${file.name}": ${validationError}`);
        return;
      }
    }

    setImageFiles(nextFiles);
    event.target.value = "";
  }

  function removeSelectedImage(index: number): void {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number): void {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeAllNewImages(): void {
    setImageFiles([]);
    setPreviewUrls([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("slug", form.slug);
      formData.append("category", form.category);
      formData.append("short", form.short);
      formData.append("organization", form.organization);
      formData.append("depositBYN", String(form.depositBYN));
      formData.append("pricePerDayBYN", String(form.pricePerDayBYN));
      formData.append("pricePerWeekBYN", String(form.pricePerWeekBYN));
      formData.append("pricePerMonthBYN", String(form.pricePerMonthBYN));
      formData.append("minDays", String(form.minDays));
      formData.append("city", form.city);
      formData.append("pickupAddress", form.pickupAddress);
      formData.append("citySlug", form.citySlug);
      formData.append("quantity", String(form.quantity));
      formData.append("fullDescription", form.fullDescription);
      formData.append("brand", form.brand);
      formData.append("model", form.model);
      formData.append("condition", form.condition);
      formData.append("deliveryAvailable", String(form.deliveryAvailable));

      form.kitIncludedText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          formData.append("kitIncluded", item);
        });

      form.specificationsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          formData.append("specifications", line);
        });

      form.faqText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          formData.append("faq", line);
        });

      existingImages.forEach((image) => {
        formData.append("keptImages", image.url);
        if (image.publicId) {
          formData.append("keptImagePublicIds", image.publicId);
        }
      });

      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (isEditing && editingProductId) {
        const response = await api.patch<ProductView>(
          API_ROUTES.productById(editingProductId),
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProductId ? response.data : product,
          ),
        );
      } else {
        const response = await api.post<ProductView>(
          API_ROUTES.products,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setProducts((prev) => [response.data, ...prev]);
      }

      resetForm();
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка сохранения товара"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(): Promise<void> {
    if (!productToDelete?._id) {
      return;
    }

    setError("");
    setDeletingId(productToDelete._id);

    try {
      await api.delete(API_ROUTES.productById(productToDelete._id));
      setProducts((prev) =>
        prev.filter((product) => product._id !== productToDelete._id),
      );

      if (editingProductId === productToDelete._id) {
        resetForm();
      }

      setProductToDelete(null);
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка удаления товара"));
    } finally {
      setDeletingId(null);
    }
  }

  function openBoostModal(product: ProductView): void {
    setError("");
    setMonetizationSuccess("");
    setBoostDuration("week");
    setMonetizationMessage(
      `Хочу поднять товар "${product.name}" выше в каталоге.`,
    );
    setMonetizationInvoice(
      product._id ? (activeBoostInvoices[product._id] ?? null) : null,
    );
    setMonetizationModal({
      open: true,
      type: "boost_product",
      product,
    });
  }

  function openLimitModal(): void {
    setError("");
    setMonetizationSuccess("");
    setRequestedLimitIncrease(1);
    setMonetizationMessage(
      "Хочу увеличить лимит на размещение товаров в кабинете.",
    );
    setMonetizationInvoice(activeLimitInvoice);
    setMonetizationModal({
      open: true,
      type: "increase_limit",
      product: null,
    });
  }

  function closeMonetizationModal(): void {
    if (monetizationLoading) {
      return;
    }

    setMonetizationModal((prev) => ({
      ...prev,
      open: false,
      product: null,
    }));
  }

  async function handleMonetizationSubmit(): Promise<void> {
    setError("");
    setMonetizationSuccess("");
    setMonetizationInvoice(null);
    setMonetizationLoading(true);

    try {
      const response = await api.post<MonetizationRequestView>(
        API_ROUTES.monetizationRequests,
        {
          type: monetizationModal.type,
          productId: monetizationModal.product?._id,
          requestedLimitIncrease,
          boostDuration,
          message: monetizationMessage,
        },
      );

      setMonetizationInvoice(response.data);
      storeActiveInvoice(response.data);
      setMonetizationSuccess("Счёт создан. Данные для оплаты показаны ниже.");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка отправки заявки"));
    } finally {
      setMonetizationLoading(false);
    }
  }

  async function handleBookingStatusChange(
    bookingId: string,
    status: "confirmed" | "cancelled",
  ): Promise<void> {
    setError("");

    try {
      const response = await api.patch<BookingView>(
        API_ROUTES.bookingById(bookingId),
        { status },
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                ...response.data,
                _id: booking._id,
                product: booking.product,
              }
            : booking,
        ),
      );

      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка обновления бронирования"));
    }
  }

  async function handleDeleteBooking(bookingId: string): Promise<void> {
    setError("");
    setDeletingBookingId(bookingId);

    try {
      await api.delete(API_ROUTES.bookingById(bookingId));

      setBookings((prev) =>
        prev.filter((booking) => booking._id !== bookingId),
      );
      router.refresh();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Ошибка удаления бронирования"));
    } finally {
      setDeletingBookingId(null);
    }
  }

  const submitButtonLabel = useMemo(() => {
    if (loading && isEditing) {
      return "Сохранение...";
    }

    if (loading) {
      return "Отправка...";
    }

    return isEditing
      ? "Сохранить и отправить на модерацию"
      : "Отправить на модерацию";
  }, [isEditing, loading]);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  useEffect(() => {
    setActiveLimitInvoice(initialInvoiceState.activeLimitInvoice);
    setActiveBoostInvoices(initialInvoiceState.activeBoostInvoices);
  }, [initialInvoiceState]);

  useEffect(() => {
    let cancelled = false;

    async function refreshInvoices(): Promise<void> {
      try {
        const response = await api.get<MonetizationRequestView[]>(
          `${API_ROUTES.monetizationRequests}?onlyActive=1`,
        );

        if (cancelled) {
          return;
        }

        const nextState = buildInvoiceState(response.data);
        setActiveLimitInvoice(nextState.activeLimitInvoice);
        setActiveBoostInvoices(nextState.activeBoostInvoices);
      } catch {
        // молча игнорируем, чтобы кабинет продолжал работать
      }
    }

    refreshInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const objectUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  return (
    <>
      <div className="space-y-8">
        {showEditorSection ? (
          <ProductEditorSection
            isEditing={isEditing}
            form={form}
            setForm={setForm}
            categories={categories}
            existingImages={existingImages}
            imageFiles={imageFiles}
            previewUrls={previewUrls}
            totalImagesCount={totalImagesCount}
            loading={loading}
            error={error}
            submitButtonLabel={submitButtonLabel}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            onFileChange={handleFileChange}
            onRemoveExistingImage={removeExistingImage}
            onRemoveSelectedImage={removeSelectedImage}
            onRemoveAllNewImages={removeAllNewImages}
          />
        ) : null}

        {showManageSection ? (
          <section className="rounded-xl border border-border-subtle bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Продвижение и лимиты</h2>
                <div className="mt-1 text-sm text-zinc-600">
                  Сейчас занято {products.length} из {currentProductLimit}{" "}
                  доступных слотов. Поднятие рейтинга влияет на сортировку
                  товара внутри каталога.
                </div>
              </div>

              <Button type="button" onClick={openLimitModal}>
                Увеличить лимит товаров
              </Button>
            </div>

            {monetizationSuccess ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {monetizationSuccess}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-dashed border-border-subtle p-4 text-sm text-zinc-600">
              После создания услуги формируется реальный счёт Express-Pay. После
              оплаты администратор сможет завершить применение услуги в панели
              управления.
            </div>

            {activeLimitInvoice ? (
              <div className="mt-4">
                <InvoiceBox
                  invoice={activeLimitInvoice}
                  onHide={() => setActiveLimitInvoice(null)}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {showManageSection ? (
          <ProductListSection
            products={products}
            deletingId={deletingId}
            productToDelete={productToDelete}
            activeBoostInvoices={activeBoostInvoices}
            onDeleteClick={setProductToDelete}
            onEditClick={startEditing}
            onBoostClick={openBoostModal}
            onHideBoostInvoice={(productId) => {
              setActiveBoostInvoices((prev) => {
                const next = { ...prev };
                delete next[productId];
                return next;
              });
            }}
          />
        ) : null}

        {showBookingsSection ? (
          <BookingsSection
            bookings={bookings}
            deletingBookingId={deletingBookingId}
            onStatusChange={handleBookingStatusChange}
            onDelete={handleDeleteBooking}
          />
        ) : null}
      </div>

      <MonetizationModal
        state={monetizationModal}
        monetizationLoading={monetizationLoading}
        monetizationMessage={monetizationMessage}
        setMonetizationMessage={setMonetizationMessage}
        requestedLimitIncrease={requestedLimitIncrease}
        setRequestedLimitIncrease={setRequestedLimitIncrease}
        boostDuration={boostDuration}
        setBoostDuration={setBoostDuration}
        monetizationInvoice={monetizationInvoice}
        setMonetizationInvoice={setMonetizationInvoice}
        setMonetizationSuccess={setMonetizationSuccess}
        onSubmit={handleMonetizationSubmit}
        onClose={closeMonetizationModal}
      />

      <Modal
        open={productToDelete !== null}
        title="Подтверждение удаления"
        onClose={() => {
          if (!deletingId) {
            setProductToDelete(null);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-700">
            Вы хотите удалить товар{" "}
            <span className="font-semibold">{productToDelete?.name ?? ""}</span>
            ?
          </p>

          <p className="text-sm text-zinc-700">
            Напишите <span className="font-semibold">удалить</span> и
            подтвердите действие.
          </p>

          <DeleteProductConfirm
            loading={deletingId === productToDelete?._id}
            onCancel={() => setProductToDelete(null)}
            onConfirm={handleDeleteProduct}
          />
        </div>
      </Modal>
    </>
  );
}
