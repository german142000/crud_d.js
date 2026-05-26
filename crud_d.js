'use strict';

// Хранилище зарегистрированных диалогов
const dialogs = new Map();
// Хранилище активных экземпляров диалогов
const activeDialogs = new Map();

// Типы полей по умолчанию
const FIELD_TYPES = {
    text: (name, params, defaultValue = '') => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const input = dom.input().cls('form-control').atr('type', 'text')
            .atr('id', `field_${name}`).atr('name', name)
            .atr('placeholder', params.placeholder || '');

        if (params.required) input.atr('required', '');
        if (params.readonly) input.atr('readonly', '');
        if (params.maxlength) input.atr('maxlength', params.maxlength);

        container.child(label);
        container.child(input);

        return {
            element: container,
            fieldName: name,
            getValue: () => input.element.value,
            setValue: (val) => { input.element.value = val || defaultValue; },
            validate: () => {
                if (params.required && !input.element.value.trim()) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    },

    number: (name, params, defaultValue = null) => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const input = dom.input().cls('form-control').atr('type', 'number')
            .atr('id', `field_${name}`).atr('name', name);

        if (params.required) input.atr('required', '');
        if (params.min !== undefined) input.atr('min', params.min);
        if (params.max !== undefined) input.atr('max', params.max);
        if (params.step) input.atr('step', params.step);

        container.child(label);
        container.child(input);

        return {
            element: container,
            fieldName: name,
            getValue: () => {
                const val = input.element.value;
                return val ? Number(val) : null;
            },
            setValue: (val) => { input.element.value = val !== null && val !== undefined ? val : ''; },
            validate: () => {
                if (params.required && input.element.value === '') {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    },

    email: (name, params, defaultValue = '') => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const input = dom.input().cls('form-control').atr('type', 'email')
            .atr('id', `field_${name}`).atr('name', name)
            .atr('placeholder', params.placeholder || '');

        if (params.required) input.atr('required', '');

        container.child(label);
        container.child(input);

        return {
            element: container,
            fieldName: name,
            getValue: () => input.element.value,
            setValue: (val) => { input.element.value = val || defaultValue; },
            validate: () => {
                if (params.required && !input.element.value.trim()) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                if (input.element.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.element.value)) {
                    return 'Неверный формат email';
                }
                return null;
            }
        };
    },

    textarea: (name, params, defaultValue = '') => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const textarea = dom.textarea().cls('form-control')
            .atr('id', `field_${name}`).atr('name', name)
            .atr('rows', params.rows || 3);

        if (params.required) textarea.atr('required', '');

        container.child(label);
        container.child(textarea);

        return {
            element: container,
            fieldName: name,
            getValue: () => textarea.element.value,
            setValue: (val) => { textarea.element.value = val || defaultValue; },
            validate: () => {
                if (params.required && !textarea.element.value.trim()) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    },

    select: (name, params, defaultValue = null) => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const select = dom.select().cls('form-select')
            .atr('id', `field_${name}`).atr('name', name);

        if (params.required) select.atr('required', '');

        if (params.options) {
            params.options.forEach(option => {
                const opt = dom.option()
                    .atr('value', option.value)
                    .text(option.label);
                select.child(opt);
            });
        }

        container.child(label);
        container.child(select);

        return {
            element: container,
            fieldName: name,
            getValue: () => select.element.value,
            setValue: (val) => {
                select.element.value = val || defaultValue || '';
            },
            validate: () => {
                if (params.required && !select.element.value) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    },

    checkbox: (name, params, defaultValue = false) => {
        const container = dom.div().cls('mb-3 form-check');
        const input = dom.input().cls('form-check-input').atr('type', 'checkbox')
            .atr('id', `field_${name}`).atr('name', name);

        if (params.required) input.atr('required', '');

        const label = dom.label().cls('form-check-label').atr('for', `field_${name}`).text(params.label || name);

        container.child(input);
        container.child(label);

        return {
            element: container,
            fieldName: name,
            getValue: () => input.element.checked,
            setValue: (val) => { input.element.checked = val || defaultValue; },
            validate: () => null
        };
    },

    date: (name, params, defaultValue = '') => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const input = dom.input().cls('form-control').atr('type', 'date')
            .atr('id', `field_${name}`).atr('name', name);

        if (params.required) input.atr('required', '');

        container.child(label);
        container.child(input);

        return {
            element: container,
            fieldName: name,
            getValue: () => input.element.value,
            setValue: (val) => { input.element.value = val || defaultValue; },
            validate: () => {
                if (params.required && !input.element.value) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    },

    password: (name, params, defaultValue = '') => {
        const container = dom.div().cls('mb-3');
        const label = dom.label().cls('form-label').atr('for', `field_${name}`).text(params.label || name);
        const input = dom.input().cls('form-control').atr('type', 'password')
            .atr('id', `field_${name}`).atr('name', name)
            .atr('placeholder', params.placeholder || '');

        if (params.required) input.atr('required', '');

        container.child(label);
        container.child(input);

        return {
            element: container,
            fieldName: name,
            getValue: () => input.element.value,
            setValue: (val) => { input.element.value = val || defaultValue; },
            validate: () => {
                if (params.required && !input.element.value) {
                    return `${params.label || name} обязательно для заполнения`;
                }
                return null;
            }
        };
    }
};

// Фабрика полей
function createField(name, fieldConfig) {
    const [type, params, defaultValue] = fieldConfig;

    if (FIELD_TYPES[type]) {
        return FIELD_TYPES[type](name, params, defaultValue);
    }

    if (type === 'custom' && params instanceof HTMLElement) {
        return {
            element: params,
            fieldName: name,
            getValue: () => {
                const input = params.querySelector('input, select, textarea');
                return input ? input.value : null;
            },
            setValue: (val) => {
                const input = params.querySelector('input, select, textarea');
                if (input) input.value = val;
            },
            validate: () => null
        };
    }

    console.warn(`Неизвестный тип поля: ${type}`);
    return FIELD_TYPES.text(name, params, defaultValue);
}

// Функция для расчета Bootstrap col класса
function getColClass(fieldsInRow) {
    if (fieldsInRow === 1) return 'col-12';
    if (fieldsInRow === 2) return 'col-md-6';
    if (fieldsInRow === 3) return 'col-md-4';
    if (fieldsInRow === 4) return 'col-md-3';
    const colSize = Math.floor(12 / fieldsInRow);
    return `col-md-${colSize}`;
}

// Функция для рендеринга полей с учетом layout
function renderFieldsWithLayout(container, fields, layout, fieldInstances) {
    const fieldNames = Object.keys(fields);
    const usedFields = new Set();

    if (layout && layout.length > 0) {
        layout.forEach(rowFields => {
            const row = dom.div().cls('row');
            const validFields = rowFields.filter(name => fields[name]);
            const colClass = getColClass(validFields.length);

            validFields.forEach(fieldName => {
                const field = createField(fieldName, fields[fieldName]);
                fieldInstances[fieldName] = field;
                usedFields.add(fieldName);

                const col = dom.div().cls(colClass);
                const fieldElement = field.element;
                if (fieldElement.element) {
                    fieldElement.element.classList.remove('mb-3');
                }

                col.child(fieldElement);
                row.child(col);
            });

            container.child(row);
        });
    }

    const remainingFields = fieldNames.filter(name => !usedFields.has(name));
    remainingFields.forEach(fieldName => {
        const row = dom.div().cls('row');
        const col = dom.div().cls('col-12');

        const field = createField(fieldName, fields[fieldName]);
        fieldInstances[fieldName] = field;

        const fieldElement = field.element;
        if (fieldElement.element) {
            fieldElement.element.classList.remove('mb-3');
        }

        col.child(fieldElement);
        row.child(col);
        container.child(row);
    });
}

// HTTP запросы
async function apiRequest(method, url, data = null) {
    const options = {
        method,
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content ?? '',
            'Content-Type': 'application/json',
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
    }

    return await response.json();
}

// Создание модального окна
function createModal(dialogId, title, fields, options = {}, mode = 'create', itemId = null) {
    const modalId = `modal_${dialogId}_${Date.now()}`;
    const { width = '', categories = null } = options;
    const config = dialogs.get(dialogId);

    // Создаем структуру модального окна
    const modal = dom.div().cls('modal fade').atr('id', modalId)
        .atr('tabindex', '-1').atr('aria-hidden', 'true');

    // Настройка ширины диалога
    const dialog = dom.div().cls('modal-dialog');
    if (width) {
        if (['sm', 'lg', 'xl'].includes(width)) {
            dialog.cls(`modal-${width}`);
        } else {
            dialog.css(`max-width: ${width}`);
        }
    }

    const content = dom.div().cls('modal-content');

    // Заголовок
    const header = dom.div().cls('modal-header');
    const titleText = mode === 'create' ? title : mode === 'create_from' ? `Скопировать из: ${title}` : `Редактирование: ${title}`;
    const titleEl = dom.h5().cls('modal-title').text(titleText);
    const closeBtn = dom.button().cls('btn-close').atr('data-bs-dismiss', 'modal').atr('aria-label', 'Close');
    header.child(titleEl);
    header.child(closeBtn);

    // Тело
    const body = dom.div().cls('modal-body');
    const alertContainer = dom.div().cls('alert alert-danger').atr('role', 'alert')
        .css('display: none');
    body.child(alertContainer);

    // Индикатор загрузки
    const loadingOverlay = dom.div().css('text-align: center; padding: 50px;');
    const spinner = dom.div().cls('spinner-border').atr('role', 'status');
    const loadingText = dom.span().cls('visually-hidden').text('Загрузка...');
    spinner.child(loadingText);
    loadingOverlay.child(spinner);
    body.child(loadingOverlay);

    // Создаем поля
    const fieldInstances = {};

    if (categories && Object.keys(categories).length > 0) {
        const fieldsInCategories = new Set();
        Object.values(categories).forEach(layout => {
            layout.forEach(row => {
                row.forEach(fieldName => fieldsInCategories.add(fieldName));
            });
        });

        const remainingFields = {};
        Object.keys(fields).forEach(fieldName => {
            if (!fieldsInCategories.has(fieldName)) {
                remainingFields[fieldName] = fields[fieldName];
            }
        });

        let finalCategories = { ...categories };
        if (Object.keys(categories).length === 1 && Object.keys(remainingFields).length > 0) {
            finalCategories['Дополнительно'] = Object.keys(remainingFields).map(name => [name]);
        } else if (Object.keys(remainingFields).length > 0) {
            finalCategories['Дополнительно'] = Object.keys(remainingFields).map(name => [name]);
        }

        const categoryNames = Object.keys(finalCategories);

        const tabNav = dom.ul().cls('nav nav-tabs').atr('role', 'tablist');
        const tabContent = dom.div().cls('tab-content').cls('mt-3');

        categoryNames.forEach((catName, index) => {
            const tabId = `tab_${dialogId}_${catName.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const isActive = index === 0;

            const navItem = dom.li().cls('nav-item').atr('role', 'presentation');
            const navLink = dom.button()
                .cls(`nav-link ${isActive ? 'active' : ''}`)
                .atr('id', `${tabId}-tab`)
                .atr('data-bs-toggle', 'tab')
                .atr('data-bs-target', `#${tabId}`)
                .atr('type', 'button')
                .atr('role', 'tab')
                .atr('aria-selected', isActive ? 'true' : 'false')
                .text(catName);
            navItem.child(navLink);
            tabNav.child(navItem);

            const tabPane = dom.div()
                .cls(`tab-pane fade ${isActive ? 'show active' : ''}`)
                .atr('id', tabId)
                .atr('role', 'tabpanel')
                .atr('aria-labelledby', `${tabId}-tab`);

            const catLayout = finalCategories[catName];
            const catFields = {};

            const catFieldNames = new Set();
            catLayout.forEach(row => {
                row.forEach(fieldName => {
                    if (fields[fieldName]) {
                        catFieldNames.add(fieldName);
                        catFields[fieldName] = fields[fieldName];
                    }
                });
            });

            renderFieldsWithLayout(tabPane, catFields, catLayout, fieldInstances);

            tabContent.child(tabPane);
        });

        body.child(tabNav);
        body.child(tabContent);

    } else {
        renderFieldsWithLayout(body, fields, null, fieldInstances);
    }

    // Скрываем лоадер
    loadingOverlay.element.style.display = 'none';

    // Футер
    const footer = dom.div().cls('modal-footer');
    const cancelBtn = dom.button().cls('btn btn-secondary').atr('data-bs-dismiss', 'modal').text('Отмена');

    // Кнопка сохранения/создания
    const submitBtn = dom.button().cls('btn btn-primary');
    const submitSpinner = dom.span().cls('spinner-border spinner-border-sm').atr('role', 'status')
        .atr('aria-hidden', 'true').css('display: none');

    if (mode === 'create' || mode === 'create_from') {
        submitBtn.text('Создать');
        submitBtn.child(submitSpinner);
        footer.child(cancelBtn);
        footer.child(submitBtn);
    } else {
        submitBtn.text('Сохранить');
        submitBtn.child(submitSpinner);

        // Кнопка удаления
        const deleteBtn = dom.button().cls('btn btn-danger').text('Удалить');
        const deleteSpinner = dom.span().cls('spinner-border spinner-border-sm').atr('role', 'status')
            .atr('aria-hidden', 'true').css('display: none');
        deleteBtn.child(deleteSpinner);

        footer.child(cancelBtn);
        footer.child(deleteBtn);
        footer.child(submitBtn);
    }

    content.child(header);
    content.child(body);
    content.child(footer);
    dialog.child(content);
    modal.child(dialog);

    document.body.appendChild(modal.done());

    const modalElement = document.getElementById(modalId);
    let bootstrapModal = null;

    if (typeof bootstrap !== 'undefined') {
        bootstrapModal = new bootstrap.Modal(modalElement);
    }

    const modalInstance = {
        modalElement,
        bootstrapModal,
        fieldInstances,
        alertContainer: alertContainer.element,
        submitBtn: submitBtn.element,
        submitSpinner: submitSpinner.element,
        loadingOverlay: loadingOverlay.element,
        getFormData: () => {
            const data = {};
            Object.entries(fieldInstances).forEach(([name, field]) => {
                data[name] = field.getValue();
            });
            return data;
        },
        validate: () => {
            const errors = [];
            Object.entries(fieldInstances).forEach(([name, field]) => {
                if (field.validate) {
                    const error = field.validate();
                    if (error) errors.push(error);
                }
            });
            return errors;
        },
        showAlert: (message) => {
            alertContainer.element.textContent = message;
            alertContainer.element.style.display = 'block';
        },
        hideAlert: () => {
            alertContainer.element.style.display = 'none';
        },
        setLoading: (loading) => {
            submitBtn.element.disabled = loading;
            submitSpinner.element.style.display = loading ? 'inline-block' : 'none';
        },
        setValues: (values) => {
            Object.entries(values).forEach(([name, value]) => {
                if (fieldInstances[name]) {
                    fieldInstances[name].setValue(value);
                }
            });
        },
        showLoadingOverlay: () => {
            loadingOverlay.element.style.display = 'block';
            // Скрываем все поля
            body.element.querySelectorAll('.row, .nav-tabs, .tab-content').forEach(el => {
                el.style.display = 'none';
            });
        },
        hideLoadingOverlay: () => {
            loadingOverlay.element.style.display = 'none';
            body.element.querySelectorAll('.row, .nav-tabs, .tab-content').forEach(el => {
                el.style.display = '';
            });
        },
        destroy: () => {
            if (bootstrapModal) {
                bootstrapModal.hide();
                bootstrapModal.dispose();
            }
            modalElement.remove();
        }
    };

    return modalInstance;
}

// Основная функция API
window.crud_d = {
    // Создание диалога
    makeDialog: function(dialogId, fields, options = {}) {
        if (typeof dialogId !== 'string') {
            throw new Error('dialogId должен быть строкой');
        }

        if (!fields || typeof fields !== 'object') {
            throw new Error('fields должен быть объектом');
        }

        // Сохраняем конфигурацию диалога
        dialogs.set(dialogId, {
            id: dialogId,
            fields: fields,
            options: options,
            endpoints: {
                create: null,
                update: null,
                get: null,
                delete: null
            }
        });

        const dialogApi = {
            // Установка эндпоинтов
            setCreateEndpoint: function(endpoint) {
                dialogs.get(dialogId).endpoints.create = endpoint;
                return this;
            },

            setUpdateEndpoint: function(endpoint) {
                dialogs.get(dialogId).endpoints.update = endpoint;
                return this;
            },

            setGetEndpoint: function(endpoint) {
                dialogs.get(dialogId).endpoints.get = endpoint;
                return this;
            },

            setDeleteEndpoint: function(endpoint) {
                dialogs.get(dialogId).endpoints.delete = endpoint;
                return this;
            },

            // Открытие в режиме создания
            openCreate: function(title = 'Создание') {
                return this._open(title, 'create');
            },

            openCreateFrom: function(itemId, title = 'Скопировать из') {
                return this._open(title, 'create_from', itemId);
            },

            // Открытие в режиме обновления
            openUpdate: function(itemId, title = 'Редактирование') {
                return this._open(title, 'update', itemId);
            },

            // Внутренний метод открытия
            _open: function(title, mode, itemId = null) {
                const config = dialogs.get(dialogId);

                // Закрываем предыдущий экземпляр если есть
                if (activeDialogs.has(dialogId)) {
                    activeDialogs.get(dialogId).destroy();
                }

                const modal = createModal(dialogId, title, config.fields, config.options, mode, itemId);
                activeDialogs.set(dialogId, modal);

                const api = {
                    onOpen: function(callback) {
                        modal.onOpen = callback;
                        return this;
                    },
                    onSuccess: function(callback) {
                        modal.onSuccess = callback;
                        return this;
                    },
                    onError: function(callback) {
                        modal.onError = callback;
                        return this;
                    },
                    onDelete: function(callback) {
                        modal.onDelete = callback;
                        return this;
                    },
                    setValues: function(values) {
                        modal.setValues(values);
                        return this;
                    },
                    getFormData: function() {
                        return modal.getFormData();
                    },
                    close: function() {
                        modal.destroy();
                        activeDialogs.delete(dialogId);
                        return this;
                    },
                    show: function() {
                        if (modal.bootstrapModal) {
                            modal.bootstrapModal.show();
                        }
                        return this;
                    }
                };

                // Загрузка данных для режима update
                if ((mode === 'update' || mode === 'create_from') && itemId) {
                    modal.showLoadingOverlay();

                    const getEndpoint = config.endpoints.get;
                    if (!getEndpoint) {
                        console.error('GET endpoint не установлен для диалога ' + dialogId);
                        modal.hideLoadingOverlay();
                        modal.showAlert('Ошибка: не указан endpoint для загрузки данных');
                        return api;
                    }

                    const url = getEndpoint.replace('{id}', itemId);

                    apiRequest('GET', url)
                        .then(data => {
                            modal.setValues(data);
                            modal.hideLoadingOverlay();
                            if (typeof modal.onOpen === 'function') {
                                modal.onOpen(modal);
                            }
                        })
                        .catch(error => {
                            modal.hideLoadingOverlay();
                            modal.showAlert('Ошибка загрузки данных: ' + error.message);
                        });
                }

                if (mode === 'create') {
                    setTimeout(() => {
                        if (typeof modal.onOpen === 'function') {
                            modal.onOpen(modal);
                        }
                    }, 100);
                }

                // Обработчик сохранения/создания
                modal.submitBtn.addEventListener('click', async () => {
                    const errors = modal.validate();
                    if (errors.length > 0) {
                        modal.showAlert(errors.join('<br>'));
                        return;
                    }

                    modal.hideAlert();
                    modal.setLoading(true);

                    try {
                        const formData = modal.getFormData();
                        let result;

                        if (mode === 'create' || mode === 'create_from') {
                            const createEndpoint = config.endpoints.create;
                            if (!createEndpoint) {
                                throw new Error('Create endpoint не установлен');
                            }
                            result = await apiRequest('POST', createEndpoint, formData);
                        } else {
                            const updateEndpoint = config.endpoints.update;
                            if (!updateEndpoint) {
                                throw new Error('Update endpoint не установлен');
                            }
                            const url = updateEndpoint.replace('{id}', itemId);
                            result = await apiRequest('PUT', url, formData);
                        }

                        if (typeof modal.onSuccess === 'function') {
                            modal.onSuccess(result);
                        }

                        modal.destroy();
                        activeDialogs.delete(dialogId);
                    } catch (error) {
                        modal.showAlert(error.message || 'Произошла ошибка');
                        modal.setLoading(false);

                        if (typeof modal.onError === 'function') {
                            modal.onError(error);
                        }
                    }
                });

                // Обработчик удаления (только для update)
                if (mode === 'update') {
                    const deleteBtn = modal.modalElement.querySelector('.btn-danger');
                    const deleteSpinner = deleteBtn.querySelector('.spinner-border');

                    deleteBtn.addEventListener('click', async () => {
                        if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
                            return;
                        }

                        modal.hideAlert();
                        deleteBtn.disabled = true;
                        deleteSpinner.style.display = 'inline-block';

                        try {
                            const deleteEndpoint = config.endpoints.delete;
                            if (!deleteEndpoint) {
                                throw new Error('Delete endpoint не установлен');
                            }
                            const url = deleteEndpoint.replace('{id}', itemId);
                            await apiRequest('DELETE', url);

                            if (typeof modal.onDelete === 'function') {
                                modal.onDelete(itemId);
                            }

                            modal.destroy();
                            activeDialogs.delete(dialogId);
                        } catch (error) {
                            modal.showAlert(error.message || 'Ошибка при удалении');
                            deleteBtn.disabled = false;
                            deleteSpinner.style.display = 'none';

                            if (typeof modal.onError === 'function') {
                                modal.onError(error);
                            }
                        }
                    });
                }

                // Обработчик закрытия
                modal.modalElement.addEventListener('hidden.bs.modal', () => {
                    modal.destroy();
                    activeDialogs.delete(dialogId);
                });

                // Показываем модальное окно
                if (modal.bootstrapModal) {
                    modal.bootstrapModal.show();
                }

                return api;
            },

            // Получить конфигурацию диалога
            getConfig: function() {
                return dialogs.get(dialogId);
            },

            // Удалить регистрацию
            destroy: function() {
                if (activeDialogs.has(dialogId)) {
                    activeDialogs.get(dialogId).destroy();
                    activeDialogs.delete(dialogId);
                }
                dialogs.delete(dialogId);
            }
        };

        return dialogApi;
    },

    // Установка эндпоинтов по имени диалога
    setCreateEndpoint: function(dialogId, endpoint) {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            dialog.endpoints.create = endpoint;
        } else {
            console.warn(`Диалог "${dialogId}" не найден`);
        }
    },

    setUpdateEndpoint: function(dialogId, endpoint) {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            dialog.endpoints.update = endpoint;
        } else {
            console.warn(`Диалог "${dialogId}" не найден`);
        }
    },

    setGetEndpoint: function(dialogId, endpoint) {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            dialog.endpoints.get = endpoint;
        } else {
            console.warn(`Диалог "${dialogId}" не найден`);
        }
    },

    setDeleteEndpoint: function(dialogId, endpoint) {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            dialog.endpoints.delete = endpoint;
        } else {
            console.warn(`Диалог "${dialogId}" не найден`);
        }
    },

    // Открытие/закрытие по имени диалога
    openCreate: function(dialogId, title = 'Создание') {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            const api = this.makeDialog(dialogId, dialog.fields, dialog.options);
            // Копируем эндпоинты
            api.getConfig().endpoints = dialog.endpoints;
            return api.openCreate(title);
        } else {
            console.error(`Диалог "${dialogId}" не найден`);
            return null;
        }
    },

    openCreateFrom: function(dialogId, itemId, title = 'Скопировать из') {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            const api = this.makeDialog(dialogId, dialog.fields, dialog.options);
            // Копируем эндпоинты
            api.getConfig().endpoints = dialog.endpoints;
            return api.openCreateFrom(itemId, title);
        } else {
            console.error(`Диалог "${dialogId}" не найден`);
            return null;
        }
    },

    openUpdate: function(dialogId, itemId, title = 'Редактирование') {
        const dialog = dialogs.get(dialogId);
        if (dialog) {
            const api = this.makeDialog(dialogId, dialog.fields, dialog.options);
            // Копируем эндпоинты
            api.getConfig().endpoints = dialog.endpoints;
            return api.openUpdate(itemId, title);
        } else {
            console.error(`Диалог "${dialogId}" не найден`);
            return null;
        }
    },

    closeDialog: function(dialogId) {
        if (activeDialogs.has(dialogId)) {
            activeDialogs.get(dialogId).destroy();
            activeDialogs.delete(dialogId);
        }
    },

    // Получить список всех зарегистрированных диалогов
    getRegisteredDialogs: function() {
        return Array.from(dialogs.keys());
    },

    // Закрыть все активные диалоги
    closeAll: function() {
        activeDialogs.forEach(modal => modal.destroy());
        activeDialogs.clear();
    }
};