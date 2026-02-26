"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { api, mapProduct, toSnake } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/types";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";

/* ── Map API Product → CatalogProduct ── */

function toCatalogProduct(p: ReturnType<typeof mapProduct>): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    sku: p.code || "",
    category: p.family || "",
    price: p.price || 0,
    status: p.isActive ? "Active" : "Inactive",
    orgId: p.orgId,
  };
}

/* ── Component ── */

export default function ProductsPage() {
  const { org } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchProducts = useCallback(async () => {
    if (!org) return;
    try {
      const raw = await api.getProducts();
      setProducts(raw.map((r: any) => toCatalogProduct(mapProduct(r))));
    } catch {
      toast("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
    );
  }, [products, search]);

  const resetForm = () =>
    setForm({ name: "", sku: "", category: "", price: "", status: "Active" });

  const handleAdd = async () => {
    if (!form.name.trim() || !org) return;
    try {
      await api.createProduct(toSnake({
        name: form.name,
        code: form.sku,
        family: form.category,
        price: Number(form.price) || 0,
        isActive: form.status === "Active",
        orgId: org.id,
      }));
      setShowAdd(false);
      resetForm();
      await fetchProducts();
      toast("Product added successfully");
    } catch {
      toast("Failed to add product");
    }
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

  const handleSaveEdit = async () => {
    if (!editId) return;
    try {
      await api.updateProduct(editId, toSnake({
        name: form.name,
        code: form.sku,
        family: form.category,
        price: Number(form.price) || 0,
        isActive: form.status === "Active",
      }));
      setEditId(null);
      resetForm();
      await fetchProducts();
      toast("Product updated");
    } catch {
      toast("Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      await fetchProducts();
      toast("Product deleted");
    } catch {
      toast("Failed to delete product");
    }
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
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyMessage="No products found"
            />
          )}
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
