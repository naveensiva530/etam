import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';

interface SkillManagerProps {
  isOpen: boolean;
  onClose: () => void;
  skills: string[];
  loading: boolean;
  saving: boolean;
  error: string;
  skillNameInput: string;
  onSkillNameChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onRenameSkill: (skill: string, newSkill: string) => Promise<boolean>;
}

export const SkillManager: React.FC<SkillManagerProps> = ({
  isOpen,
  onClose,
  skills,
  loading,
  saving,
  error,
  skillNameInput,
  onSkillNameChange,
  onAddSkill,
  onRemoveSkill,
  onRenameSkill,
}) => {
  const [editingSkill, setEditingSkill] = React.useState('');
  const [editedSkillName, setEditedSkillName] = React.useState('');

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-skill-manager-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 id="staff-skill-manager-title" className="text-base font-bold">Manage Teaching Skills</h2>
          <button
            type="button"
            aria-label="Close skill manager"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onAddSkill();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={skillNameInput}
              maxLength={100}
              onChange={(event) => onSkillNameChange(event.target.value)}
              placeholder="Enter a teaching skill"
              aria-label="New teaching skill"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Plus className="h-4 w-4" /> Add Skill
            </button>
          </form>

          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              Teaching Skills
            </div>
            <div className="max-h-72 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {loading ? (
                <p className="px-3 py-4 text-sm text-zinc-500">Loading skills…</p>
              ) : skills.length ? (
                skills.map((skill) => (
                  <div key={skill} className="flex items-center justify-between gap-3 px-3 py-2">
                    {editingSkill === skill ? (
                      <>
                        <input
                          autoFocus
                          value={editedSkillName}
                          maxLength={100}
                          onChange={(event) => setEditedSkillName(event.target.value)}
                          aria-label={`Edit ${skill}`}
                          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          aria-label={`Save ${skill}`}
                          title="Save skill name"
                          onClick={async () => {
                            if (await onRenameSkill(skill, editedSkillName)) {
                              setEditingSkill('');
                              setEditedSkillName('');
                            }
                          }}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-600 dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel skill edit"
                          onClick={() => {
                            setEditingSkill('');
                            setEditedSkillName('');
                          }}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">{skill}</span>
                        <button
                          type="button"
                          disabled={saving}
                          aria-label={`Edit ${skill}`}
                          title="Edit skill"
                          onClick={() => {
                            setEditingSkill(skill);
                            setEditedSkillName(skill);
                          }}
                          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          aria-label={`Remove ${skill}`}
                          title="Remove skill"
                          onClick={() => onRemoveSkill(skill)}
                          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-zinc-500">No teaching skills added yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
};
