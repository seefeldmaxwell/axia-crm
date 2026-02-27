"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Collapsible } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/toast";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-data";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Plus, Tag, DollarSign, Package } from "lucide-react";

export default function CommercePage() {
  const { org } = useAuth();
  const { toast } = useToast();
  const { data: products, loading, error, refetch } = useProducts(org?.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", price: "", family: "" });

  const columns = [
    {
      key: "name", label: "Product Name", sortable: true,
      render: (p: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Package size={16} className="text-zen-primary shrink-0" />
          <span className="font-medium text-zen-primary hover:underline">{String(p.name)}</span>
        </div>
      ),
    },
    { key: "code", label: "Code", sortable: true },
    { key: "family", label: "Family", sortable: true },
    {
      key: "price", label: "Price", sortable: true,
      render: (p: Record<string, unknown>) => `$${Number(p.price)}/user/mo`,
    },
    {
      key: "isActive", label: "Status", sortable: true,
      render: (p: Record<string, unknown>) => (
        <Badge variant={p.isActive ? "success" : "neutral"}>
          {p.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleCreate = async () => {
    if (!org) return;
    try {
      await createProduct.mutate({
        name: form.name,
        code: form.code,
        description: form.description,
        price: parseFloat(form.price) || 0,
        family: form.family,
        isActive: true,
        orgId: org.id,
      });
      setShowNew(false);
      setForm({ name: "", code: "", description: "", price: "", family: "" });
      refetch();
      toast("Product created successfully");
    } catch {
      toast("Failed to create product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutate(id);
      setSelectedProduct(null);
      refetch();
      toast("Product deleted");
    } catch {
      toast("Failed to delete product");
    }
  };

  if (!org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 w-64 bg-zen-border rounded animate-pulse" />
          <div className="h-96 bg-zen-border rounded animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center py-20">
          <p className="text-zen-error mb-2">Failed to load products</p>
          <Button variant="secondary" onClick={refetch}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-zen-text">Products & Price Books</h1>
            <p className="text-sm text-zen-text-secondary">{products.length} products</p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={16} className="mr-1" /> New Product
          </Button>
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={products as unknown as Record<string, unknown>[]}
            onRowClick={(item) => setSelectedProduct(item as unknown as Product)}
          />
        </Card>
      </div>

      {/* Product Detail Modal */}
      <Modal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || "Product Detail"}
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <Tag size={20} className="mx-auto text-zen-primary mb-1" />
                  <p className="text-sm font-semibold text-zen-text">{selectedProduct.code}</p>
                  <p className="text-xs text-zen-text-secondary">Product Code</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <DollarSign size={20} className="mx-auto text-zen-success mb-1" />
                  <p className="text-sm font-semibold text-zen-text">${selectedProduct.price}/mo</p>
                  <p className="text-xs text-zen-text-secondary">Base Price</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Package size={20} className="mx-auto text-purple-500 mb-1" />
                  <p className="text-sm font-semibold text-zen-text">{selectedProduct.family}</p>
                  <p className="text-xs text-zen-text-secondary">Family</p>
                </CardContent>
              </Card>
            </div>

            <Collapsible title="Product Details">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zen-text-secondary">Status</span>
                  <Badge variant={selectedProduct.isActive ? "success" : "neutral"}>
                    {selectedProduct.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="pt-2">
                  <span className="text-zen-text-secondary block mb-1">Description</span>
                  <p className="text-zen-text">{selectedProduct.description}</p>
                </div>
              </div>
            </Collapsible>

            {selectedProduct.pricingTiers && selectedProduct.pricingTiers.length > 0 && (
              <Collapsible title="Pricing Tiers">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zen-border">
                      <th className="text-left py-2 text-xs font-semibold text-zen-text-secondary uppercase">Min Quantity</th>
                      <th className="text-right py-2 text-xs font-semibold text-zen-text-secondary uppercase">Price/User/Mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.pricingTiers.map((tier, i) => (
                      <tr key={i} className="border-b border-zen-border last:border-0">
                        <td className="py-2 text-zen-text">{tier.minQty}+ users</td>
                        <td className="py-2 text-right font-medium text-zen-text">${tier.price}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Collapsible>
            )}
          </div>
        )}
        {selectedProduct && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => handleDelete(selectedProduct.id)}>Delete Product</Button>
          </div>
        )}
      </Modal>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Product" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price ($/mo)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" />
            <Input label="Family" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Save</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
