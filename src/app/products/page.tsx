"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "@/components/ui/search";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { generateId, formatCurrency } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/types";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

/* ── Default catalog products ── */

const defaultProducts: CatalogProduct[] = [
  { id: "cp1", name: "Cybersecurity Assessment", sku: "CYBER-001", category: "Security", price: 5000, status: "Active", orgId: "org1" },
  { id: "cp2", name: "Managed IT Support", sku: "MIT-001", category: "Services", price: 2000, status: "Active", orgId: "org1" },
  { id: "cp3", name: "Pentest Package", sku: "PEN-001", category: "Security", price: 8000, status: "Active", orgId: "org1" },
  { id: "cp4", name: "24/7 Monitoring", sku: "MON-001", category: "Services", price: 3000, status: "Active", orgId: "org1" },
  { id: "cp5", name: "Compliance Audit", sku: "COMP-001", category: "Compliance", price: 12000, status: "Inactive", orgId: "org1" },
];

/* ── localStorage helpers ── */

function getStoredProducts(): CatalogProduct[] {
  if (typeof window === "undefined") return defaultProducts;
  try {
    const raw = localStorage.getItem("axia_catalog_products");
    return raw ? JSON.parse(raw) : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

function setStoredProducts(products: CatalogProduct[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("axia_catalog_products", JSON.stringify(products));
}

/* ── Component ── */

export default function ProductsPage() {
  const { org } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    status: "Active" as CatalogProduct["status"],
  });

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);

  const saveProducts = (updated: CatalogProduct[]) => {
    setProducts(updated);
    setStoredProducts(updated);
  };

  const filtered = useMemo(() => {
    if (!org) return [];
    const orgProducts = products.filter((p) => p.orgId === org.id);
    if (!search) return orgProducts;
    const s = search.toLowerCase();
    return orgProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
    );
  }, [products, search, org]);

  const resetForm = () =>
    setForm({ name: "", sku: "", category: "", price: "", status: "Active" });

  const handleAdd = () => {
    if (!form.name.trim() || !org) return;
    const newProduct: CatalogProduct = {
      id: generateId(),
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price) || 0,
      status: form.status,
      orgId: org.id,
    };
    saveProducts([...products, newProduct]);
    setShowAdd(false);
    resetForm();
    toast("Product added successfully");
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      status: product.status,
    });
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const updated = products.map((p) =>
      p.id === editId
        ? {
            ...p,
            name: form.name,
            sku: form.sku,
            category: form.category,
            price: Number(form.price) || 0,
            status: form.status,
          }
        : p
    );
    saveProducts(updated);
    setEditId(null);
    resetForm();
    toast("Product updated");
  };

  const handleDelete = (id: string) => {
    saveProducts(products.filter((p) => p.id !== id));
    toast("Product deleted");
  };

  const statusVariant: Record<string, "success" | "neutral"> = {
    Active: "success",
    Inactive: "neutral",
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Package size={15} style={{ color: "var(--accent-blue)" }} className="shrink-0" />
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {String(row.name)}
          </span>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span
          className="data-value"
          style={{ fontSize: "12px", color: "var(--text-secondary)" }}
        >
          {String(row.sku)}
        </span>
      ),
    },
    { key: "category", label: "Category", sortable: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium data-value" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(Number(row.price))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge variant={statusVariant[String(row.status)] || "neutral"}>
          {String(row.status)}
        </Badge>
      ),
    },
    {
      key: "_actions",
      label: "Actions",
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row as unknown as CatalogProduct)}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(String(row.id))}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent-red)";
              e.currentTarget.style.background = "var(--accent-red-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      className: "w-24",
    },
  ];

  if (!org) return null;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1
              className="text-[20px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--text-primary)" }}
            >
              Products
            </h1>
            <span className="data-label">CATALOG MANAGEMENT</span>
          </div>
          <div className="flex items-center gap-3">
            <Search
              value={search}
              onChange={setSearch}
              placeholder="Search products..."
              className="w-64"
            />
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Product
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            emptyMessage="No products found"
          />
        </Card>
      </div>

      {/* Add Product Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); resetForm(); }}
        title="Add Product"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Product name"
          />
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="e.g. CYBER-001"
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Security"
          />
          <Input
            label="Price ($)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0"
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as CatalogProduct["status"] })
            }
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => { setShowAdd(false); resetForm(); }}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd}>Save</Button>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        open={!!editId}
        onClose={() => { setEditId(null); resetForm(); }}
        title="Edit Product"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            label="Price ($)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as CatalogProduct["status"] })
            }
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => { setEditId(null); resetForm(); }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>Update</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
