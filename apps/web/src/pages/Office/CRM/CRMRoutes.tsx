import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CRM from '.';
import CustomerDetail from './Customers/Detail';
import ContractList from './Contracts';
import ContractDetailEnhanced from './Contracts/DetailEnhanced';

const CRMRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<CRM />} />
      <Route path="customers/:id" element={<CustomerDetail />} />
      <Route path="contracts" element={<ContractList />} />
      <Route path="contracts/:id" element={<ContractDetailEnhanced />} />
      <Route path="*" element={<Navigate to="" />} />
    </Routes>
  );
};

export default CRMRoutes;