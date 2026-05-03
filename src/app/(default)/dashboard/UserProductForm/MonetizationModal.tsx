"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  BOOST_FIXED_VALUE,
  getBoostDurationLabel,
  getBoostPriceByDuration,
} from "@/lib/boost-pricing";
import type {
  BoostDuration,
  MonetizationRequestView,
} from "@/types/monetization";
import type { MonetizationModalState } from "./types";
import { InvoiceBox } from "./InvoiceBox";

type Props = {
  state: MonetizationModalState;
  monetizationLoading: boolean;
  monetizationMessage: string;
  setMonetizationMessage: (value: string) => void;
  requestedLimitIncrease: number;
  setRequestedLimitIncrease: (value: number) => void;
  boostDuration: BoostDuration;
  setBoostDuration: (value: BoostDuration) => void;
  monetizationInvoice: MonetizationRequestView | null;
  setMonetizationInvoice: (value: MonetizationRequestView | null) => void;
  setMonetizationSuccess: (value: string) => void;
  onSubmit: () => Promise<void>;
  onClose: () => void;
};

export function MonetizationModal({
  state,
  monetizationLoading,
  monetizationMessage,
  setMonetizationMessage,
  requestedLimitIncrease,
  setRequestedLimitIncrease,
  boostDuration,
  setBoostDuration,
  monetizationInvoice,
  setMonetizationInvoice,
  setMonetizationSuccess,
  onSubmit,
  onClose,
}: Props) {
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={
        state.type === "boost_product"
          ? "Повысить рейтинг товара"
          : "Увеличить лимит товаров"
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-zinc-600">
          {state.type === "boost_product" ? (
            <>
              Выберите срок платного повышения рейтинга.{" "}
              {/* Значение повышения
              фиксированное и составляет +{BOOST_FIXED_VALUE}. */}
            </>
          ) : (
            <>
              Отправь заявку на увеличение лимита товаров.{" "}
              {/* После отправки
              система сразу сформирует счёт через Express-Pay / ЕРИП. */}
            </>
          )}
        </div>

        {state.type === "boost_product" ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            {/* <div className="text-sm font-medium text-zinc-900">
              Фиксированный буст: +{BOOST_FIXED_VALUE} к рейтингу
            </div> */}

            <label className="flex flex-col gap-1 text-sm">
              Срок действия буста
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={boostDuration}
                onChange={(event) =>
                  setBoostDuration(event.target.value as BoostDuration)
                }
              >
                <option value="week">Неделя</option>
                {/* <option value="month">Месяц</option>
                <option value="year">Год</option> */}
              </select>
            </label>

            <div className="rounded-lg bg-white/80 px-3 py-2 text-sm text-zinc-700">
              Стоимость:{" "}
              <span className="font-semibold">
                {/* {getBoostPriceByDuration(boostDuration).toFixed(2)} BYN */}
                бессплатно
              </span>
              <div className="mt-1 text-xs text-zinc-500">
                Срок: {getBoostDurationLabel(boostDuration)} · повышение
                рейтинга применяет администратор {/* после оплаты. */}
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            На сколько увеличить лимит товаров
            <input
              type="number"
              min={1}
              className="rounded-md border px-3 py-2 text-sm"
              value={requestedLimitIncrease}
              disabled
              onChange={(event) =>
                setRequestedLimitIncrease(
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Комментарий для администратора
          <textarea
            rows={4}
            className="rounded-md border px-3 py-2 text-sm"
            value={monetizationMessage}
            onChange={(event) => setMonetizationMessage(event.target.value)}
            placeholder="Например: хочу поднять товар перед сезоном"
          />
        </label>

        {/* <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          После отправки система сразу создаст счёт в Express-Pay. Сама услуга
          применяется после подтверждения факта оплаты в административной
          панели.
        </div> */}

        {monetizationInvoice ? (
          <InvoiceBox
            invoice={monetizationInvoice}
            onHide={() => {
              setMonetizationInvoice(null);
              setMonetizationSuccess("");
              onClose();
            }}
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={monetizationLoading}
          >
            {monetizationLoading ? "Отправка..." : "Отправить заявку"}
          </Button>

          <Button
            type="button"
            onClick={onClose}
            disabled={monetizationLoading}
            newClasses="bg-transparent border border-border-subtle text-zinc-800"
          >
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
