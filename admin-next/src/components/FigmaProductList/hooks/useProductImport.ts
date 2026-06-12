import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { isDarazFormat } from '../utils';

interface UseProductImportOptions {
  propProducts: Product[];
  onImport?: () => void;
  onBulkImport?: (products: Product[]) => void;
  importInputRef: React.RefObject<HTMLInputElement>;
}

interface UseProductImportReturn {
  handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportCSV: () => void;
}

/** Generate a numeric ID that doesn't collide with existingIds */
const generateUniqueId = (existingIds: Set<number>): number => {
  let id = Date.now() + Math.floor(Math.random() * 10000);
  let attempts = 0;
  while (existingIds.has(id) && attempts < 1000) {
    id = Date.now() + Math.floor(Math.random() * 1_000_000);
    attempts++;
  }
  return id;
};

/** Get the first truthy value for a list of row keys */
const getRowValue = (row: any, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return '';
};

/** Parse a single Daraz/Lazada-format CSV row into a Product */
const parseDarazProduct = (row: any, existingIds: Set<number>): Product => {
  const newId = generateUniqueId(existingIds);
  existingIds.add(newId);

  const imageKeys = [
    'Product Images1', '*Product Images1',
    'Product Images2', 'Product Images3', 'Product Images4',
    'Product Images5', 'Product Images6', 'Product Images7', 'Product Images8',
    'White Background Image',
    'Image 1', '*Image 1', 'Image1', '*Image1',
    'Image 2', 'Image2', 'Image 3', 'Image3',
    'Image 4', 'Image4', 'Image 5', 'Image5',
    'Image 6', 'Image6', 'Image 7', 'Image7',
    'Image 8', 'Image8',
  ];

  const galleryImages: string[] = [];
  imageKeys.forEach(key => {
    const value = row[key];
    if (value && typeof value === 'string' && value.trim()) {
      galleryImages.push(value.trim());
    }
  });

  const productName = getRowValue(row, ['*Product Name(English)', 'Product Name(English)', '*Product Name', 'Product Name', 'Name']);
  const productNameBengali = getRowValue(row, ['Product Name(Bengali)']);
  const mainDescription = getRowValue(row, ['Main Description', '*Short Description', 'Short Description', 'Description', 'Product Description']);
  const highlights = getRowValue(row, ['Highlights', '*Highlights']);

  let fullDescription = mainDescription;
  if (productNameBengali) {
    fullDescription = `<p><strong>Bengali:</strong> ${productNameBengali}</p>${fullDescription}`;
  }
  if (highlights?.trim()) {
    fullDescription = `${fullDescription}<div class="highlights"><h4>Highlights</h4>${highlights}</div>`;
  }

  const warranty = getRowValue(row, ['Warranty']);
  const warrantyType = getRowValue(row, ['Warranty Type']);
  const warrantyPolicy = getRowValue(row, ['Warranty Policy']);
  if (warranty || warrantyType || warrantyPolicy) {
    const warrantyText = [warranty, warrantyType, warrantyPolicy].filter(Boolean).join(' - ');
    fullDescription = `${fullDescription}<p><strong>Warranty:</strong> ${warrantyText}</p>`;
  }

  const slug = productName.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .substring(0, 100);

  return {
    id: newId,
    name: productName || 'Unnamed Product',
    price: parseFloat(getRowValue(row, ['Price', '*Price', 'Sale Price', '*Sale Price', 'Special Price', '*Special Price']) || '0') || 0,
    originalPrice: parseFloat(getRowValue(row, ['Original Price', 'Regular Price', 'Price', '*Price']) || '0') || 0,
    costPrice: 0,
    image: galleryImages[0] || '',
    galleryImages,
    description: fullDescription,
    category: getRowValue(row, ['Category', '*Category']),
    subCategory: getRowValue(row, ['Sub Category']),
    childCategory: getRowValue(row, ['Child Category']),
    brand: getRowValue(row, ['Brand', '*Brand', 'Brand Name']),
    sku: getRowValue(row, ['SellerSKU', '*SellerSKU', 'Seller SKU', '*Seller SKU', 'SKU', 'Product ID']) || `SKU-${newId}`,
    stock: parseInt(getRowValue(row, ['Stock', 'Quantity', '*Quantity', 'Available Stock']) || '0') || 0,
    status: 'Active' as const,
    tags: [],
    slug: slug || `product-${newId}`,
    title: '',
    salePrice: undefined,
  };
};

/** Parse a single standard CSV row into a Product */
const parseStandardProduct = (row: any, existingIds: Set<number>): Product => {
  const newId = generateUniqueId(existingIds);
  existingIds.add(newId);

  return {
    id: newId,
    name: row.name || row.Name || row.product_name || row['Product Name'] || row['*Product Name'] || 'Unnamed Product',
    price: parseFloat(row.price || row.Price || row.salesPrice || row.sales_price || '0') || 0,
    originalPrice: parseFloat(row.originalPrice || row.original_price || row.regularPrice || row.regular_price || '0') || 0,
    costPrice: parseFloat(row.costPrice || row.cost_price || '0') || 0,
    image: row.image || row.Image || row.mainImage || row.main_image || '',
    galleryImages: (row.galleryImages || row.gallery_images || '').split(',').filter(Boolean).map((s: string) => s.trim()),
    description: row.description || row.Description || '',
    category: row.category || row.Category || '',
    subCategory: row.subCategory || row.sub_category || '',
    childCategory: row.childCategory || row.child_category || '',
    brand: row.brand || row.Brand || '',
    sku: row.sku || row.SKU || `SKU-${newId}`,
    stock: parseInt(row.stock || row.Stock || row.quantity || row.Quantity || '0') || 0,
    status: (row.status || row.Status || 'Active') as 'Active' | 'Draft',
    tags: (row.tags || row.Tags || '').split(',').filter(Boolean).map((s: string) => s.trim()),
    slug: row.slug || row.Slug || (row.name || row.Name || '').toLowerCase().replace(/\s+/g, '-'),
    title: '',
    salePrice: undefined,
  };
};

export function useProductImport({
  propProducts,
  onImport,
  onBulkImport,
  importInputRef,
}: UseProductImportOptions): UseProductImportReturn {
  const processImportedData = useCallback((data: any[], headers: string[]) => {
    try {
      const existingIds = new Set(propProducts.map(p => p.id));
      const useDarazFormat = isDarazFormat(headers);

      const allParsed: Product[] = data.map((row: any) =>
        useDarazFormat
          ? parseDarazProduct(row, existingIds)
          : parseStandardProduct(row, existingIds)
      );

      const importedProducts = allParsed.filter(
        (p: Product) => p.name !== 'Unnamed Product' || p.price > 0 || p.image
      );

      if (importedProducts.length === 0) {
        toast.error('No valid products found in file');
        return;
      }

      if (onBulkImport) {
        onBulkImport(importedProducts);
        toast.success(`Imported ${importedProducts.length} products successfully! (${useDarazFormat ? 'Daraz format' : 'Standard format'})`);
      } else {
        toast.success(`Parsed ${importedProducts.length} products. Connect onBulkImport handler to save.`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file data');
    }
  }, [propProducts, onBulkImport]);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (onImport) {
      onImport();
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isTSV = fileName.endsWith('.tsv');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const headers = Object.keys(jsonData[0] || {});
          processImportedData(jsonData, headers);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast.error('Failed to parse Excel file');
        }
      };
      reader.onerror = () => toast.error('Failed to read Excel file');
      reader.readAsArrayBuffer(file);
    } else {
      const sampleReader = new FileReader();
      sampleReader.onload = (e) => {
        const sampleText = (e.target?.result as string || '').substring(0, 2000);
        const firstLine = sampleText.split('\n')[0] || '';
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const detectedDelimiter = isTSV || tabCount > commaCount ? '\t' : (commaCount > 0 ? ',' : undefined);

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          delimiter: detectedDelimiter,
          complete: (results) => {
            const headers = results.meta.fields || [];
            processImportedData(results.data, headers);
          },
          error: (error) => {
            toast.error('Failed to parse file');
            console.error('File parse error:', error);
          },
        });
      };
      sampleReader.readAsText(file.slice(0, 2000));
    }

    if (importInputRef.current) importInputRef.current.value = '';
  }, [onImport, processImportedData, importInputRef]);

  const handleExportCSV = useCallback(() => {
    if (propProducts.length === 0) {
      toast.error('No products to export');
      return;
    }
    const dataToExport = propProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || '',
      sku: p.sku || '',
      stock: p.stock || 0,
      category: p.category || '',
      subCategory: p.subCategory || '',
      brand: p.brand || '',
      status: p.status || 'Active',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.join(';') : '',
      description: p.description || '',
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${propProducts.length} products`);
  }, [propProducts]);

  return { handleImportFile, handleExportCSV };
}
