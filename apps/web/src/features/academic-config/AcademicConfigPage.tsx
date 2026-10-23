/**
 * AcademicConfigPage — slim orchestrator (~100 lines).
 *
 * Delegates rendering to:
 *   - ConfigListView    → main list / table
 *   - SubjectMasterView → subject master management
 *   - AllocationView    → section & subject allocation
 *
 * All heavy logic now lives in the respective sub-components and hooks.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { useAcademicConfigData } from './hooks/useAcademicConfigData';
import { ConfigListView } from './components/ConfigListView';
import { SubjectMasterView } from './components/SubjectMasterView';
import { AllocationView } from './components/AllocationView';
import type { AcademicConfigItem, SubjectMasterRecord } from './types';

type PanelView = 'list' | 'manage' | 'master';

interface AcademicConfigPageProps {
  initialView?: 'list' | 'allocation' | 'master';
}

export const AcademicConfigPage: React.FC<AcademicConfigPageProps> = ({ initialView = 'list' }) => {
  // ── Derive initial panel state ──────────────────────────────────────────────
  const derivePanelView = (view: typeof initialView): PanelView => {
    if (view === 'master') return 'master';
    if (view === 'allocation') return 'manage';
    return 'list';
  };

  const [panelViewMode, setPanelViewMode] = useState<PanelView>(() => derivePanelView(initialView));
  const [selectedConfig, setSelectedConfig] = useState<AcademicConfigItem | null>(() => {
    if (initialView !== 'allocation') return null;
    try {
      const stored = sessionStorage.getItem('e_tam_pending_subject_config');
      return stored ? (JSON.parse(stored) as AcademicConfigItem) : null;
    } catch {
      return null;
    }
  });

  // Sync view when `initialView` prop changes (tab navigation)
  useEffect(() => {
    setPanelViewMode(derivePanelView(initialView));
  }, [initialView]);

  // ── Shared data ─────────────────────────────────────────────────────────────
  const {
    configs,
    setConfigs,
    subjects: subjectMaster,
    setSubjects: setSubjectMaster,
    subjectTypes,
    setSubjectTypes,
    loadError,
  } = useAcademicConfigData();

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    if (loadError) showToast(loadError);
  }, [loadError]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const handleSelectConfig = (cfg: AcademicConfigItem) => {
    setSelectedConfig(cfg);
    setPanelViewMode('manage');
  };

  const handleBack = () => {
    setPanelViewMode('list');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-6 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl text-xs font-semibold"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* ── List View ── */}
      {panelViewMode === 'list' && (
        <ConfigListView
          configs={configs}
          onConfigsChange={setConfigs}
          onSelectConfig={handleSelectConfig}
          onOpenMasterView={() => setPanelViewMode('master')}
          showToast={showToast}
        />
      )}

      {/* ── Subject Master View ── */}
      {panelViewMode === 'master' && (
        <SubjectMasterView
          subjects={subjectMaster}
          onSubjectsChange={setSubjectMaster as React.Dispatch<React.SetStateAction<SubjectMasterRecord[]>>}
          types={subjectTypes}
          onTypesChange={(nextTypes) => {
            const renamedTypes = new Map(
              subjectTypes.flatMap((previous) => {
                const updated = nextTypes.find((item) => item.id === previous.id);
                return updated && updated.name !== previous.name ? [[previous.name, updated.name] as const] : [];
              }),
            );
            if (renamedTypes.size > 0) {
              setSubjectMaster((current) =>
                current.map((subject) => ({
                  ...subject,
                  type: renamedTypes.get(subject.type) || subject.type,
                })),
              );
            }
            setSubjectTypes(nextTypes);
          }}
          showToast={showToast}
        />
      )}

      {/* ── Allocation / Manage View ── */}
      {panelViewMode === 'manage' && selectedConfig && (
        <AllocationView
          selectedConfig={selectedConfig}
          subjectMaster={subjectMaster}
          configs={configs}
          setConfigs={setConfigs}
          isAllocationOnly={initialView === 'allocation'}
          onBack={handleBack}
          showToast={showToast}
        />
      )}
    </div>
  );
};
