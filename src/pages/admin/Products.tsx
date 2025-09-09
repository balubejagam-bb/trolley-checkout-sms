import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, Search, Package } from 'lucide-react';

interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  gst_percent: number;
  stock_count: number;
  image_url: string;
  is_active: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    brand: '',
    category: '',
    price: '',
    gst_percent: '',
    stock_count: '',
    image_url: ''
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/scan');
      return;
    }
    fetchProducts();
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchQuery]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        gst_percent: parseFloat(formData.gst_percent || '18'),
        stock_count: parseInt(formData.stock_count || '0'),
        is_active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Product added successfully');
      }

      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.code === '23505') {
        toast.error('Barcode already exists');
      } else {
        toast.error('Error saving product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      price: product.price.toString(),
      gst_percent: product.gst_percent.toString(),
      stock_count: product.stock_count.toString(),
      image_url: product.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product');
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      brand: '',
      category: '',
      price: '',
      gst_percent: '18',
      stock_count: '0',
      image_url: ''
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <Button onClick={() => navigate('/scan')}>Back to Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Product Management</h1>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode *</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    step="0.01"
                    value={formData.gst_percent}
                    onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Count</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_count}
                    onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, brand, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {product.category}
                      </Badge>
                      <div className="mt-2 space-y-1">
                        <p className="font-bold text-primary">₹{product.price}</p>
                        <p className="text-xs text-muted-foreground">
                          GST: {product.gst_percent}% | Stock: {product.stock_count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.barcode}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first product'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;