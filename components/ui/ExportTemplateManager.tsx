"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, FolderOpen, Trash2, Star, StarOff } from "lucide-react";

interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  exportType: string;
  exportFormat: string;
  parameters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportTemplateManagerProps {
  exportType: string;
  exportFormat: string;
  currentParameters: Record<string, unknown>;
  onLoadTemplate: (template: ExportTemplate) => void;
}

export function ExportTemplateManager({
  exportType,
  exportFormat,
  currentParameters,
  onLoadTemplate,
}: ExportTemplateManagerProps) {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: "",
    description: "",
    isDefault: false,
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        exportType,
        exportFormat,
      });

      const response = await fetch(`/api/admin/export/templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error("Failed to fetch templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [exportType, exportFormat]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async () => {
    if (!saveForm.name.trim()) {
      alert("Template name is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/export/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: saveForm.name,
          description: saveForm.description,
          exportType,
          exportFormat,
          parameters: currentParameters,
          isDefault: saveForm.isDefault,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates((prev) => [data.template, ...prev]);
        setShowSaveDialog(false);
        setSaveForm({ name: "", description: "", isDefault: false });
        alert("Template saved successfully!");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleLoadTemplate = (template: ExportTemplate) => {
    onLoadTemplate(template);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/export/templates?id=${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        alert("Template deleted successfully!");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert(
        `Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleToggleDefault = async (template: ExportTemplate) => {
    try {
      const response = await fetch("/api/admin/export/templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: template.id,
          isDefault: !template.isDefault,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === template.id
              ? { ...t, isDefault: data.template.isDefault }
              : t.exportType === template.exportType
                ? { ...t, isDefault: false }
                : t,
          ),
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      alert(
        `Failed to update template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL");
  };

  return (
    <div className="space-y-4">
      {/* Save Current Configuration */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-blue-900">Save Current Configuration</h3>
          <p className="text-sm text-blue-700">
            Save your current export settings as a template for future use
          </p>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </button>
      </div>

      {/* Templates List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Saved Templates</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>
              No templates found for {exportType} {exportFormat} exports
            </p>
            <p className="text-sm">Save a template to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleDefault(template)}
                    className="text-yellow-500 hover:text-yellow-600"
                    title={template.isDefault ? "Remove as default" : "Set as default"}
                  >
                    {template.isDefault ? (
                      <Star className="w-5 h-5 fill-current" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      {template.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Created {formatDate(template.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLoadTemplate(template)}
                    className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                    title="Load template"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Save Export Template</h3>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={saveForm.name}
                      onChange={(e) => setSaveForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter template name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={saveForm.description}
                      onChange={(e) =>
                        setSaveForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={saveForm.isDefault}
                      onChange={(e) =>
                        setSaveForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">
                      Set as default template for {exportType} {exportFormat} exports
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveTemplate}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
