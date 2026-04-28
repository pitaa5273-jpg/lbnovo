// LocalStorage CRUD layer used as a fallback when the remote API is unavailable.

const PREFIX = "lb_db_";

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function localDB(resource) {
  const key = `${PREFIX}${resource}`;

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }
  function writeAll(arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  return {
    list() {
      return readAll();
    },
    get(id) {
      return readAll().find((it) => String(it.id) === String(id));
    },
    create(data) {
      const arr = readAll();
      const item = { id: data.id || uid(), createdAt: new Date().toISOString(), ...data };
      arr.push(item);
      writeAll(arr);
      return item;
    },
    update(id, data) {
      const arr = readAll();
      const idx = arr.findIndex((it) => String(it.id) === String(id));
      if (idx === -1) return null;
      arr[idx] = { ...arr[idx], ...data, id: arr[idx].id, updatedAt: new Date().toISOString() };
      writeAll(arr);
      return arr[idx];
    },
    upsert(item) {
      if (!item || !item.id) return this.create(item || {});
      const arr = readAll();
      const idx = arr.findIndex((it) => String(it.id) === String(item.id));
      if (idx === -1) arr.push(item);
      else arr[idx] = { ...arr[idx], ...item };
      writeAll(arr);
      return item;
    },
    remove(id) {
      const arr = readAll().filter((it) => String(it.id) !== String(id));
      writeAll(arr);
    },
    replaceAll(items) {
      writeAll(Array.isArray(items) ? items : []);
    },
  };
}

export const RESOURCES = [
  "clientes", "veiculos", "os", "servicos", "pecas",
  "orcamentos", "financeiro", "garantias",
];

export function getEmpresa() {
  try {
    return JSON.parse(localStorage.getItem("lb_empresa") || "null");
  } catch { return null; }
}
export function setEmpresa(data) {
  localStorage.setItem("lb_empresa", JSON.stringify(data || {}));
}
