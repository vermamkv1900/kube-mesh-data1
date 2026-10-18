import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { NetworkingView } from './components/NetworkingView';
import { ObservabilityView } from './components/ObservabilityView';
import { OpenSourceView } from './components/OpenSourceView';
import { TerminalSimulator } from './components/TerminalSimulator';
import { ExportModal } from './components/ExportModal';

import { KUBERNETES_PROJECTS } from './data/projectsData';
import { K8sProject, ProjectCategory } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'projects' | 'networking' | 'observability' | 'opensource' | 'terminal'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<K8sProject | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<ProjectCategory>();
    KUBERNETES_PROJECTS.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, []);

  // Filter projects by search and category
  const filteredProjects = useMemo(() => {
    return KUBERNETES_PROJECTS.filter((proj) => {
      const matchesCat = selectedCategory === 'all' || proj.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;

      const matchesText =
        proj.title.toLowerCase().includes(q) ||
        proj.tagline.toLowerCase().includes(q) ||
        proj.architectureSummary.toLowerCase().includes(q) ||
        (proj.description ? proj.description.toLowerCase().includes(q) : false) ||
        proj.primaryStack.some((tech) => tech.toLowerCase().includes(q)) ||
        proj.manifests.some((m) => m.content.toLowerCase().includes(q));

      return matchesCat && matchesText;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'projects' && (
          <div>
            {/* Hero Section */}
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
            />

            {/* Projects Grid Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Production Infrastructure Blueprints
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showing {filteredProjects.length} of {KUBERNETES_PROJECTS.length} platform architectures
                  </p>
                </div>

                {searchQuery && (
                  <div className="text-xs text-slate-400">
                    Filtered by: <span className="text-cyan-400">&ldquo;{searchQuery}&rdquo;</span>
                  </div>
                )}
              </div>

              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 border border-slate-850 rounded-lg">
                  <p className="text-sm text-slate-300 font-medium">No infrastructure projects match your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-3 px-3.5 py-1.5 text-xs text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/10 cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project, idx) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={idx}
                      onSelect={(p) => setSelectedProject(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'networking' && <NetworkingView />}

        {activeTab === 'observability' && <ObservabilityView />}

        {activeTab === 'opensource' && <OpenSourceView />}

        {activeTab === 'terminal' && <TerminalSimulator />}
      </main>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Export Manifests Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Clean Unadorned Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-400">KubeForge Platform Blueprints</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Declarative Kubernetes Infrastructure Suite</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('projects')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('networking')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Networking & CNI
            </button>
            <button
              onClick={() => setActiveTab('observability')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Observability
            </button>
            <button
              onClick={() => setActiveTab('opensource')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Open Source
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              CLI Console
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
