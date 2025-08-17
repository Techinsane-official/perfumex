'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  ArrowRight, 
  Save, 
  Upload, 
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

// Define the types locally to avoid import issues
interface ColumnMapping {
  brand?: string;
  productName?: string;
  variantSize?: string;
  ean?: string;
  wholesalePrice?: string;
  currency?: string;
  packSize?: string;
  supplier?: string;
  lastPurchasePrice?: string;
  availability?: string;
  notes?: string;
  [key: string]: string | undefined;
}

interface SupplierMappingTemplate {
  id: string;
  supplierId: string;
  name: string;
  isDefault: boolean;
  columnMappings: ColumnMapping;
  dataCleaningRules: Record<string, any>;
}

interface ColumnMappingUIProps {
  csvHeaders: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onSaveTemplate?: (template: SupplierMappingTemplate) => void;
  savedTemplates?: SupplierMappingTemplate[];
  supplierName?: string;
}

const CANONICAL_FIELDS = [
  { key: 'brand', label: 'Brand', required: true, description: 'Product brand name' },
  { key: 'productName', label: 'Product Name', required: true, description: 'Product name/title' },
  { key: 'variantSize', label: 'Variant/Size (ml)', required: true, description: 'Size in milliliters' },
  { key: 'ean', label: 'EAN', required: false, description: 'European Article Number' },
  { key: 'wholesalePrice', label: 'Wholesale Price', required: true, description: 'Supplier price' },
  { key: 'currency', label: 'Currency', required: true, description: 'Price currency' },
  { key: 'packSize', label: 'Pack Size', required: false, description: 'Quantity per pack' },
  { key: 'supplier', label: 'Supplier Name', required: true, description: 'Supplier identifier' },
  { key: 'lastPurchasePrice', label: 'Last Purchase Price', required: false, description: 'Previous purchase price' },
  { key: 'availability', label: 'Availability', required: false, description: 'Stock status' },
  { key: 'notes', label: 'Notes', required: false, description: 'Additional information' }
];

export default function ColumnMappingUI({
  csvHeaders,
  onMappingComplete,
  onSaveTemplate,
  savedTemplates = [],
  supplierName = ''
}: ColumnMappingUIProps) {
  
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [autoMapped, setAutoMapped] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (csvHeaders && csvHeaders.length > 0 && !autoMapped) {
      autoMapColumns();
    }
  }, [csvHeaders, autoMapped]);

  const autoMapColumns = () => {
    const autoMapping: ColumnMapping = {};
    
    if (csvHeaders && Array.isArray(csvHeaders)) {
      csvHeaders.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Try to find exact matches first
        const exactMatch = CANONICAL_FIELDS.find(field => 
          lowerHeader.includes(field.key.toLowerCase()) ||
          field.key.toLowerCase().includes(lowerHeader)
        );
        
        if (exactMatch) {
          autoMapping[exactMatch.key] = header;
          return;
        }
        
        // Try partial matches
        if (lowerHeader.includes('brand') || lowerHeader.includes('merk')) {
          autoMapping.brand = header;
        } else if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('title')) {
          autoMapping.productName = header;
        } else if (lowerHeader.includes('size') || lowerHeader.includes('ml') || lowerHeader.includes('volume')) {
          autoMapping.variantSize = header;
        } else if (lowerHeader.includes('ean') || lowerHeader.includes('barcode')) {
          autoMapping.ean = header;
        } else if (lowerHeader.includes('price') || lowerHeader.includes('cost')) {
          autoMapping.wholesalePrice = header;
        } else if (lowerHeader.includes('currency') || lowerHeader.includes('curr')) {
          autoMapping.currency = header;
        } else if (lowerHeader.includes('pack') || lowerHeader.includes('quantity') || lowerHeader.includes('qty')) {
          autoMapping.packSize = header;
        } else if (lowerHeader.includes('supplier') || lowerHeader.includes('vendor')) {
          autoMapping.supplier = header;
        } else if (lowerHeader.includes('purchase') || lowerHeader.includes('buy')) {
          autoMapping.lastPurchasePrice = header;
        } else if (lowerHeader.includes('stock') || lowerHeader.includes('available') || lowerHeader.includes('inventory')) {
          autoMapping.availability = header;
        } else if (lowerHeader.includes('note') || lowerHeader.includes('comment') || lowerHeader.includes('desc')) {
          autoMapping.notes = header;
        }
      });
    }
    
    setMapping(autoMapping);
    setAutoMapped(true);
  };

  const handleMappingChange = (canonicalField: string, csvHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [canonicalField]: csvHeader
    }));
  };

  const clearMapping = (canonicalField: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[canonicalField];
      return newMapping;
    });
  };

  const loadTemplate = (templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setMapping(template.columnMappings);
      setSelectedTemplate(templateId);
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    
    const template: SupplierMappingTemplate = {
      id: Date.now().toString(),
      supplierId: '',
      name: templateName,
      isDefault: false,
      columnMappings: mapping,
      dataCleaningRules: {}
    };
    
    if (onSaveTemplate) onSaveTemplate(template);
    setTemplateName('');
  };

  const validateMapping = () => {
    const requiredFields = CANONICAL_FIELDS.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !mapping[field.key]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields: missingFields.map(f => f.label)
    };
  };

  const handleComplete = () => {
    const validation = validateMapping();
    if (validation.isValid) {
      onMappingComplete(mapping);
    }
  };

  const validation = validateMapping();

  return (
    <div className="space-y-6">
      {/* Template Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Mapping Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <Button onClick={saveTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </div>
          
          {savedTemplates.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Load Template:</label>
              <div className="flex flex-wrap gap-2">
                {savedTemplates.map(template => (
                  <Button 
                    key={template.id} 
                    variant={selectedTemplate === template.id ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={() => loadTemplate(template.id)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Column Mapping
            <Button variant="outline" size="sm" onClick={autoMapColumns}>
              Auto-Map
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CSV Headers */}
            <div>
              <label className="text-sm font-medium text-gray-700">CSV Headers (Source)</label>
              <div className="mt-2 space-y-2">
                {csvHeaders && csvHeaders.map((header, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-gray-50 text-sm font-mono"
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>

            {/* Canonical Fields */}
            <div>
              <label className="text-sm font-medium text-gray-700">Canonical Fields (Target)</label>
              <div className="mt-2 space-y-2">
                {CANONICAL_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {mapping[field.key] && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select CSV column"
                        value={mapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        list={`options-${field.key}`}
                      />
                      {mapping[field.key] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearMapping(field.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <datalist id={`options-${field.key}`}>
                      {csvHeaders && csvHeaders.map((header, index) => (
                        <option key={index} value={header} />
                      ))}
                    </datalist>
                    
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation & Actions */}
      <Card>
        <CardContent className="pt-6">
          {!validation.isValid && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Required fields missing:</span>
              </div>
              <ul className="mt-2 ml-6 list-disc text-sm text-red-600">
                {validation.missingFields.map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button
              onClick={handleComplete}
              disabled={!validation.isValid}
              className="flex-1"
            >
              Complete Mapping
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
