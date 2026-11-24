# Реорганизация домашнего экрана и вывод средств

> Исторический анализ решения от 9 ноября. Описание реализации и QA ниже отражает состояние на эту дату. Актуальные сценарии находятся в `Cashier/Screens/Withdrawal` в Storybook и в `src/App.tsx`. Текущая касса включает криптовывод и дополнительные способы, доступные после успешного пополнения соответствующим способом.

## Текущая реализация — 18 ноября 2026

- В `App` регион задан как Польша. Список методов вывода формируется по успешным депозитам и доступности метода в регионе. При зачисленном криптодепозите доступен криптовывод.
- Вывод в фиате использует сохранённое или добавленное назначение. Криптовывод показывает выбор актива, сети и адреса. Значения, комиссии и сроки иллюстративны.
- Ожидающий или неопределённый вывод резервирует сумму и комиссию в локальном балансе. Успешный вывод уменьшает баланс, неуспешный не удерживает средства. История и баланс хранятся в памяти и сбрасываются при перезагрузке.
- Экранные состояния находятся в `Cashier/Screens/Withdrawal` и `Cashier/Screens/History`. `Cashier/Design system/Withdrawal flow` — отдельный референсный сценарий.
- Реального провайдера, перевода средств и постоянного хранения нет. Интеграция должна получать актуальные реквизиты, комиссии и статусы от провайдера.

---

**Дата:** 9 ноября 2026  
**Scope:** Живая касса (`src/App.tsx`) и дизайн-система (`src/components/cashier-ds/`).

---

## 1. Резюме

Домашний экран кассы был перегружен и не давал выбрать направление операции: `Deposit` был статичной подписью, поле `Currency` не было нужно, а вывода средств не существовало. Мы выбрали **Вариант A**: два таба-направления (`Deposit` / `Withdraw`) и вторичный переключатель `Cash` / `Crypto` под `Deposit`. Поле `Currency` удалено. Добавлен полный флоу вывода средств: метод, сумма, review, обработка, успех, история и баланс.

---

## 2. Что было сломано

| Проблема | Почему это важно |
| --- | --- |
| `Deposit` — статичный текст, не таб | Пользователь не может выбрать вывод; направление не очевидно. |
| Поле `Currency` на домашнем экране | Регион зафиксирован, методы уже отфильтрованы; селект только сбрасывал выбор и путал. |
| Карточки `Add cash` / `Transfer crypto` дублировали список методов | Лишний шаг: сначала карточка, потом тот же список методов. |
| Нет вывода средств | Невозможно забрать деньги из кассы. |
| Экран начинался с популярных методов сразу после карточек | Иерархия была перевернута: направление → тип → методы. |

---

## 3. Выбранный вариант — A

**Структура:**

```
[ Deposit ]  [ Withdraw ]          Balance: 100.00 PLN

[ Cash ]  [ Crypto ]

Popular methods
BLIK
Bank transfer
Card
...
```

- `Deposit` / `Withdraw` — основной выбор направления.
- `Cash` / `Crypto` — вторичный выбор типа депозита.
- Методы показываются сразу, без промежуточных карточек.
- `Currency` убран; валюта видна в балансе и в review.

**Почему не B и не C:**

- **B** (табы + карточки `Add cash` / `Transfer crypto`) сохраняет лишний шаг и дублирование.
- **C** (три таба `Deposit cash` / `Deposit crypto` / `Withdraw`) тесный на мобильном и теряет единый `Deposit`.

Вариант A дает один понятный выбор направления, убирает валютный селект и делает вывод видимым сразу.

---

## 4. Флоу вывода средств

1. **Домашний экран → таб `Withdraw`.** Показываются методы вывода: `Bank transfer` и `Card`.
2. **Выбор метода.** Для карты — поля карты; для банка — выбор банка.
3. **Сумма.** Доступный баланс показан в подсказке; сумма не может превышать `balance - fee`.
4. **Review.** Строки: `You withdraw`, `Destination`, `Fee`, `Total deducted`.
5. **Обработка.** Кнопка `Withdraw` переходит в `Processing…`, контент остается на месте.
6. **Успех.** `Withdrawal successful`, таймлайн `Withdrawal started → Confirmed → Deducted from balance`, баланс уменьшается на `amount + fee`.
7. **История.** Вывод отображается как `Withdrawal · Card` / `Withdrawal · Bank transfer` с минусом и статусом. Направление показано стрелкой (вниз — депозит, вверх — вывод), цвет иконки и статуса — светофор: зелёный — завершено, жёлтый — ожидание, красный — ошибка, серый — отменено/истекло. Неудачные суммы перечёркнуты.

### Деньги и комиссии

- `amount` — сколько пользователь хочет получить.
- `fee` — комиссия метода (банк 2%, карта 3% в референсных данных).
- `total deducted = amount + fee`.
- Баланс уменьшается на `amount + fee`.
- Валюта остается одной (PLN по умолчанию); при смене валюты баланс пересчитывается.

---

## 5. Компоненты

### Новые

| Файл | Компонент | Назначение |
| --- | --- | --- |
| `src/components/cashier-ds/withdraw-cash-flow.tsx` | `WithdrawCashFlow` | Референсный флоу вывода в дизайн-системе: hub → сумма → метод → review → обработка → успех. |
| `src/stories/design-system.stories.tsx` | `WithdrawalFlow` | Сторис референсного флоу. |

### Измененные в `src/App.tsx`

| Компонент | Изменение |
| --- | --- |
| `DirectionTabs` | Новый сегмент `Deposit` / `Withdraw`. |
| `CategoryTabs` | Новый сегмент `Cash` / `Crypto` под `Deposit`. |
| `AmountPicker` | Пропы `direction` и `maxAmount`; подсказка `Available ...` для вывода. |
| `MethodDetails` | Проп `direction`; строки `You withdraw`, `Destination`, `Total deducted`. |
| `PaymentStatusPanel` | Проп `direction`; таймлайн и копирайт вывода. |
| `WithdrawalTimeline` | Новый таймлайн вывода. |
| `HistoryRow` / `HistoryDetails` | Поддержка `direction: "withdrawal"`, минус в сумме, тосты вывода. |
| `Transaction` | Новое поле `direction?: "deposit" \| "withdrawal"`. |
| `withdrawalMethods` | Экспортированный список методов вывода. |

### Удалено

- `CurrencyCountryPicker` и поле `Currency` на домашнем экране.
- Карточки `Add cash` / `Transfer crypto` на домашнем экране.

---

## 6. Модель данных

```ts
type TransactionDirection = "deposit" | "withdrawal"

type Transaction = {
  id: number
  reference: string
  createdAt: string
  method: string
  amount: number
  fee: number | null
  currency: Currency
  status: Exclude<PaymentStatus, "idle">
  direction?: TransactionDirection
  destination?: string
  delayed?: boolean
  cancelable?: boolean
  chargeState?: "not_charged" | "charged" | "unknown"
  declineReason?: "bank" | "funds" | "technical"
  expiresAt?: string
}
```

Баланс:

```ts
balance = Σ(success deposits.amount) − Σ(success withdrawals.amount + fee)
```

---

## 7. Копирайт и ограничения

- Никаких `demo`, `prototype`, `mock` в пользовательском интерфейсе.
- Крипто-депозит показывает иллюстративный адрес и QR; в продакшене они должны приходить от провайдера. Вывод — только в fiat (банк / карта).
- Один заполненный экшен на экран: `Withdraw` / `Confirm`.
- Состояния без денег: `Nothing was deducted.`
- Успех не дед-энд: есть `Back to game` и `Make another withdrawal`.
- Статусы: `Withdrawal pending`, `Checking withdrawal`, `Withdrawal failed`, `Withdrawal canceled`, `Withdrawal expired`.

---

## 8. Доступность

- Табы используют `role="tablist"` / `role="tab"` и `aria-selected`.
- Сумма — реальный input с `label`, `hint` и `error`.
- Статусы объявляются через `role="status"` / `role="alert"`.
- Все интерактивные элементы — нативные `button`.
- Фокус виден; reduced-motion уважается на уровне `.cashier-ds`.

---

## 9. Интеграция с провайдером

1. Заменить референсные `feeRate`, лимиты и список методов на данные провайдера.
2. Заменить `setTimeout` в обработке на реальный запрос; сохранить пользователя на review.
3. Маппить статусы провайдера на `pending`, `success`, `failed`, `canceled`, `expired`, `unknown`.
4. Не выводить средства, если провайдер не подтвердил списание.
5. Не показывать успех только по HTTP 200.
6. Крипто-депозит использует иллюстративный адрес и QR; в продакшене они должны приходить от провайдера. Крипто-вывод не реализован.

---

## 10. QA-чек-лист

- [ ] На домашнем экране видны табы `Deposit` / `Withdraw`.
- [ ] Поля `Currency` больше нет.
- [ ] Под `Deposit` есть переключатель `Cash` / `Crypto`.
- [ ] Под `Withdraw` видны методы вывода.
- [ ] Сумма вывода не превышает доступный баланс.
- [ ] Review показывает `You withdraw`, `Destination`, `Fee`, `Total deducted`.
- [ ] Успех уменьшает баланс на `amount + fee`.
- [ ] История показывает выводы с минусом и статусом.
- [ ] В истории цвет иконки и статуса совпадает со статусом транзакции.
- [ ] Неудачные суммы перечёркнуты.
- [ ] Крипто-депозит показывает адрес и QR.
- [ ] Нет сообщений `Demo`, `No deposit address available`. Крипто-адрес и QR помечены как иллюстративные в документации, но не в виджете.
- [ ] Клавиатура, фокус, reduced-motion и 200% zoom работают.

---

## 11. Как посмотреть

- **Живая касса:** `pnpm dev` → `http://localhost:5173/` → таб **Withdraw**.
- **Storybook:** `pnpm storybook` → `http://localhost:6006/` → **Cashier/Design system** → **Withdrawal flow**.
- **Сторис живой кассы:** `Cashier/Screens` → `Deposit` (включая `P24Deposit`, `TrustlyDeposit`, `PaysafecardDeposit`, `ApplePayDeposit`, `GooglePayDeposit`), `Withdrawal Home`, `Withdrawal Bank`, `Withdrawal Card`, `Withdrawal Pending`, `Withdrawal Success`, `Withdrawal Failed`, `Mixed History With Withdrawal`.
- **In-game top-up:** `Cashier/Screens/InGame TopUp` → `Low Balance`, `High Bet`, `Success` (компонент `QuickTopUpFlow`: добор баланса без выхода из игры, P24 + банк, комиссия до Confirm).

---

## 12. Статус

- `pnpm typecheck` — проходит.
- `pnpm build` — проходит (`tsc -b` + `vite build`).
- `pnpm lint` — проходит.
- `pnpm build-storybook` — проходит.
- Референсные флоу и живая касса обновлены.
- Осталось для продакшена: реальные провайдерские данные, статусы и поддержка крипто-вывода.
