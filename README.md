# crud_d.js

`crud_d` — надстройка над библиотекой [`dom.js`](https://github.com/german142000/dom.js/releases/tag/v1.0) v1.0 для быстрого создания модальных диалогов с CRUD-функциональностью (Create, Read, Update, Delete).  
Позволяет описать поля формы, эндпоинты для API, автоматически строить модальное окно с валидацией, отправкой данных и обработкой ответов.  
Для стилизации используется **Bootstrap 5** (CSS и JS).

---

## Быстрый старт

```html
<!-- Подключение Bootstrap 5 (CSS и JS) -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Подключение dom.js и crud_d.js -->
<script src="dom.js"></script>
<script src="crud_d.js"></script>

<script>
  // 1. Создаём диалог
  const userDialog = crud_d.makeDialog('user', {
    name: ['text', { label: 'Имя', required: true }],
    email: ['email', { label: 'Email', required: true }],
    age: ['number', { label: 'Возраст', min: 0 }]
  });

  // 2. Настраиваем эндпоинты (URL с плейсхолдером {id} для редактирования)
  userDialog
    .setCreateEndpoint('/api/users')
    .setUpdateEndpoint('/api/users/{id}')
    .setGetEndpoint('/api/users/{id}')
    .setDeleteEndpoint('/api/users/{id}');

  // 3. Открываем диалог создания
  document.getElementById('createBtn').addEventListener('click', () => {
    userDialog.openCreate('Новый пользователь')
      .onSuccess(result => console.log('Создан:', result))
      .onError(err => console.error('Ошибка:', err));
  });

  // 4. Открываем диалог редактирования (например, по ID из кнопки)
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      userDialog.openUpdate(id, 'Редактировать пользователя')
        .onSuccess(result => console.log('Обновлён:', result))
        .onDelete(() => console.log('Удалён'));
    });
  });
</script>
```

---

## Зависимости

- **Bootstrap 5** (CSS + JS). Модальные окна используют компонент `bootstrap.Modal`.
- **dom.js** — библиотека для декларативного построения DOM (объект `window.dom` должен быть доступен).
- На странице должен присутствовать мета‑тег `<meta name="csrf-token" content="...">` для CSRF‑защиты в заголовках запросов.

---

## Основные концепции

- **Диалог** — конфигурация, задающая набор полей и опций. Создаётся один раз через `makeDialog`.
- **Экземпляр диалога** — открытое модальное окно. Может существовать только один экземпляр для одного dialogId (предыдущий закрывается автоматически при повторном открытии).
- **Поля** — элементы формы, описанные как `[тип, параметры, значение_по_умолчанию]`.
- **Layout** — возможность группировать поля в строки и колонки (Bootstrap grid) или разбивать на вкладки (категории).
- **Режимы**:
  - `create` — создание новой записи.
  - `create_from` — копирование существующей записи (загружаются данные и открывается как новое создание).
  - `update` — редактирование существующей записи, доступно удаление.

---

## API

### `crud_d.makeDialog(dialogId, fields, options = {})`

Создаёт объект конфигурации диалога и возвращает **API диалога** для цепочечной настройки.

#### Параметры

- **dialogId** (string) — уникальный идентификатор диалога.
- **fields** (object) — объект, ключи которого — имена полей, значения — массивы `[type, params, defaultValue]`.
- **options** (object, необязательно):
  - `width` (string) — ширина модального окна:
    - `'sm'`, `'lg'`, `'xl'` — стандартные Bootstrap‑размеры,
    - или любое CSS-значение (например, `'800px'`).
  - `categories` (object) — разбивка полей по вкладкам. Ключ — название вкладки, значение — массив строк (имён полей), где каждая строка — массив полей в одной строке (layout). Например:
    ```js
    categories: {
      'Основное': [
        ['name', 'email'], // в одной строке два поля
        ['age']
      ],
      'Дополнительно': [
        ['bio']
      ]
    }
    ```
    Поля, не попавшие ни в одну категорию, автоматически добавляются в отдельную вкладку «Дополнительно».
  - `categories` может быть опущена, тогда все поля рендерятся вертикально (каждое в своей строке).

Возвращает объект с методами:

- `.setCreateEndpoint(url)` — задать URL для POST‑запроса создания.
- `.setUpdateEndpoint(url)` — URL для PUT‑запроса обновления (должен содержать `{id}`).
- `.setGetEndpoint(url)` — URL для GET‑запроса получения данных элемента (с `{id}`).
- `.setDeleteEndpoint(url)` — URL для DELETE‑запроса удаления (с `{id}`).
- `.openCreate(title?)` — открыть диалог в режиме создания. Возвращает **API открытого диалога** (см. ниже).
- `.openCreateFrom(itemId, title?)` — открыть в режиме копирования. Загружаются данные по GET‑эндпоинту, поля заполняются, но при сохранении выполняется POST‑запрос.
- `.openUpdate(itemId, title?)` — открыть в режиме редактирования. Загружаются данные, при сохранении — PUT, доступна кнопка удаления.
- `.getConfig()` — вернуть исходную конфигурацию диалога.
- `.destroy()` — полностью удалить регистрацию диалога и закрыть активный экземпляр.

---

### API открытого диалога

Методы, возвращаемые `openCreate`, `openCreateFrom`, `openUpdate`:

- `.onOpen(callback)` — вызывается после того, как окно показано и (для update/create_from) после загрузки данных. Получает экземпляр модального окна.
- `.onSuccess(callback)` — вызывается при успешном сохранении (создании/обновлении). Аргумент — ответ сервера (JSON).
- `.onError(callback)` — вызывается при ошибке сохранения/загрузки/удаления. Аргумент — объект ошибки.
- `.onDelete(callback)` — вызывается после успешного удаления. Аргумент — `itemId`.
- `.setValues(data)` — программно установить значения полей (объект `{ fieldName: value }`).
- `.getFormData()` — получить текущие данные формы в виде объекта.
- `.close()` — закрыть и уничтожить диалог.
- `.show()` — показать модальное окно (обычно не нужно, вызывается автоматически).

Все методы возвращают тот же объект API, позволяя строить цепочки вызовов.

---

### Глобальные методы `crud_d`

Эти методы позволяют работать с диалогами по их `dialogId`, без предварительного получения объекта диалога:

- `crud_d.setCreateEndpoint(dialogId, url)`  
- `crud_d.setUpdateEndpoint(dialogId, url)`  
- `crud_d.setGetEndpoint(dialogId, url)`  
- `crud_d.setDeleteEndpoint(dialogId, url)`  

- `crud_d.openCreate(dialogId, title?)`  
- `crud_d.openCreateFrom(dialogId, itemId, title?)`  
- `crud_d.openUpdate(dialogId, itemId, title?)`  

- `crud_d.closeDialog(dialogId)` — закрыть активный экземпляр указанного диалога.  
- `crud_d.closeAll()` — закрыть все открытые диалоги.  
- `crud_d.getRegisteredDialogs()` — получить массив идентификаторов всех зарегистрированных диалогов.

---

## Описание полей (types)

Каждое поле определяется массивом:

```
fieldName: [type, params, defaultValue]
```

- **type** (string) — тип поля. Доступны: `'text'`, `'number'`, `'email'`, `'textarea'`, `'select'`, `'checkbox'`, `'date'`, `'password'`, а также `'custom'`.
- **params** (object) — параметры поля, зависят от типа. Общие свойства:
  - `label` — текст метки (по умолчанию `name`),
  - `required` — булево, делает поле обязательным,
  - `placeholder` (для text, email, password),
  - `readonly`, `maxlength` (для text),
  - `min`, `max`, `step` (для number),
  - `rows` (для textarea),
  - `options` (для select) — массив объектов `{ value, label }`.
- **defaultValue** — значение по умолчанию. Для checkbox — `false`, для number — `null`, для остальных — `''`.

**Особый тип `'custom'`**: если вместо объекта `params` передан HTML‑элемент, он будет вставлен как поле. Библиотека попытается найти в нём `<input>`, `<select>` или `<textarea>` для чтения/установки значения.

Примеры:

```js
fields: {
  title: ['text', { label: 'Заголовок', required: true, maxlength: 100 }],
  description: ['textarea', { label: 'Описание', rows: 5 }],
  age: ['number', { label: 'Возраст', min: 0, max: 150 }],
  email: ['email', { label: 'Email', required: true }],
  role: ['select', { label: 'Роль', options: [
    { value: 'user', label: 'Пользователь' },
    { value: 'admin', label: 'Админ' }
  ]}],
  active: ['checkbox', { label: 'Активен' }, true],
  birthdate: ['date', { label: 'Дата рождения' }]
}
```

---

## Валидация

При отправке формы вызывается метод `validate()` у каждого поля.  
Для большинства типов проверяется только `required`.  
Для `email` дополнительно проверяется формат.  
Если есть ошибки, они отображаются в alert-блоке внутри модального окна и отправка не происходит.

---

## HTTP‑запросы

- Все запросы отправляются с заголовком `X-CSRF-TOKEN` (значение из мета‑тега) и `Content-Type: application/json`.
- Для `GET` используется `apiRequest('GET', url)`, для `POST` — `apiRequest('POST', url, data)`, для `PUT` — `apiRequest('PUT', url, data)`, для `DELETE` — `apiRequest('DELETE', url)`.
- Ожидается, что ответ сервера — JSON. В случае HTTP‑ошибки (статус не 2xx) выбрасывается исключение с сообщением из поля `message` ответа или стандартным текстом.

---

## Продвинутый пример с категориями и layout

```js
const productDialog = crud_d.makeDialog('product', {
  name: ['text', { label: 'Название', required: true }],
  price: ['number', { label: 'Цена', min: 0, step: 0.01 }],
  description: ['textarea', { label: 'Описание' }],
  category: ['select', {
    label: 'Категория',
    options: [
      { value: 'electronics', label: 'Электроника' },
      { value: 'books', label: 'Книги' }
    ]
  }],
  in_stock: ['checkbox', { label: 'В наличии' }]
}, {
  width: 'lg',
  categories: {
    'Основная информация': [
      ['name', 'price'],   // два поля в одной строке
      ['description']      // одно поле на всю строку
    ],
    'Дополнительно': [
      ['category', 'in_stock']
    ]
  }
});

productDialog
  .setCreateEndpoint('/api/products')
  .setUpdateEndpoint('/api/products/{id}')
  .setGetEndpoint('/api/products/{id}')
  .setDeleteEndpoint('/api/products/{id}');

// Кнопка создания
document.getElementById('addProduct').onclick = () => {
  productDialog.openCreate('Новый товар')
    .onSuccess(data => {
      console.log('Товар создан', data);
      location.reload(); // или обновить таблицу
    });
};

// Кнопки редактирования
document.querySelectorAll('.edit-product').forEach(btn => {
  btn.onclick = () => {
    const id = btn.dataset.id;
    productDialog.openUpdate(id, 'Редактировать товар')
      .onSuccess(data => console.log('Обновлён', data))
      .onDelete(id => {
        console.log('Удалён товар', id);
        btn.closest('tr').remove(); // пример удаления строки
      });
  };
});
```

---

## Примечания

- Если `bootstrap` (объект Bootstrap 5) не определён, модальное окно не будет работать через `bootstrap.Modal`. При этом DOM‑элемент окна всё равно будет создан в документе; вам придётся управлять его видимостью вручную.
- При открытии диалога в режиме `update` или `create_from` данные загружаются асинхронно, и колбэк `onOpen` вызывается **после** загрузки (или после небольшой задержки в режиме `create`). Поэтому в `onOpen` можно, например, модифицировать состояние кнопок.
- Кнопка «Удалить» появляется только в режиме `update`. Перед выполнением запроса выводится нативное окно `confirm`.
- Индикаторы загрузки (спиннеры) автоматически включаются во время запросов и для первоначальной загрузки данных.
- Все создаваемые модальные окна автоматически уничтожаются при закрытии (событие `hidden.bs.modal`), поэтому повторное открытие создаёт новый DOM.
- При вызове любого метода открытия для того же `dialogId` предыдущее окно (если открыто) закрывается и уничтожается.

---

## Заключение

Библиотека `crud_d` значительно упрощает рутинное создание CRUD-интерфейсов в связке с бэкендом. Вы описываете поля и эндпоинты, а всё остальное — генерация HTML, валидация, AJAX-запросы, состояния загрузки — берёт на себя библиотека.
