import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { TimetableDepartmentList } from '../components/TimetableDepartmentList';
import { TimetableConfigEditor } from '../components/TimetableConfigEditor';
import { TimetableViewMatrix } from '../components/TimetableViewMatrix';
import type {
  DepartmentTimetableItem,
  TimetableConfig,
} from '../types/timetable.types';

type PageViewMode = 'list' | 'editor' | 'view';

export const TimetablePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<PageViewMode>('list');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentTimetableItem | null>(null);
  const [currentConfig, setCurrentConfig] = useState<TimetableConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    departments,
    loading,
    saving,
    teachingStaff,
    availableSubjects,
    loadOptionsForDepartment,
    loadTimetableForDepartment,
    saveTimetable,
  } = useTimetableData();

  // Handle department row selection from listing
  const handleSelectDepartment = async (dept: DepartmentTimetableItem) => {
    setSelectedDepartment(dept);
    const existingConfig = await loadTimetableForDepartment(dept);
    setCurrentConfig(existingConfig);

    if (dept.status === 'Created' && existingConfig) {
      setViewMode('view');
    } else {
      await loadOptionsForDepartment(dept.id, dept.sections[0]);
      setViewMode('editor');
    }
  };

  // Switch to editor mode from view mode
  const handleEditFromView = async () => {
    if (!selectedDepartment) return;
    await loadOptionsForDepartment(
      selectedDepartment.id,
      selectedDepartment.sections[0]
    );
    setViewMode('editor');
  };

  // Save handler from editor
  const handleSaveConfig = async (payload: Partial<TimetableConfig>) => {
    try {
      const saved = await saveTimetable(payload as any);
      setCurrentConfig(saved);
      showToast('Time table Configuration saved successfully!', 'success');
      setViewMode('list');
    } catch (err: any) {
      showToast(err.message || 'Failed to save timetable configuration', 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-6 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-red-600 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Department Listing View ── */}
      {viewMode === 'list' && (
        <TimetableDepartmentList
          departments={departments}
          loading={loading}
          onSelectDepartment={handleSelectDepartment}
        />
      )}

      {/* ── 2. Timetable Editor View ── */}
      {viewMode === 'editor' && selectedDepartment && (
        <TimetableConfigEditor
          department={selectedDepartment}
          initialConfig={currentConfig}
          teachingStaff={teachingStaff}
          availableSubjects={availableSubjects}
          isSaving={saving}
          onBack={() => setViewMode('list')}
          onSave={handleSaveConfig}
        />
      )}

      {/* ── 3. Timetable Readonly Matrix View ── */}
      {viewMode === 'view' && currentConfig && (
        <TimetableViewMatrix
          config={currentConfig}
          onBack={() => setViewMode('list')}
          onEdit={handleEditFromView}
        />
      )}
    </div>
  );
};
