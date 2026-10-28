import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProblemsListPage } from './pages/ProblemsListPage';
import { ProblemDetailsPage } from './pages/ProblemDetailsPage';
import { AddEditProblemPage } from './pages/AddEditProblemPage';
import { RevisionPage } from './pages/RevisionPage';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="problems" element={<ProblemsListPage />} />
        <Route path="problems/new" element={<AddEditProblemPage />} />
        <Route path="problems/:id" element={<ProblemDetailsPage />} />
        <Route path="problems/:id/edit" element={<AddEditProblemPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
