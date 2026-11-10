import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [tableInfo, setTableInfo] = useState(null); // { id, branch_id, table_code, qr_token }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Fetch available branches
    api.getBranches()
      .then((data) => {
        setBranches(data || []);
        if (data && data.length > 0) {
          // Check saved preference or default to first open branch
          const savedBranchId = localStorage.getItem('income_selected_branch_id');
          const found = data.find((b) => b.id.toString() === savedBranchId);
          setSelectedBranch(found || data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load branches:', err);
        // Fallback default branches
        const fallback = [
          { id: 1, name: 'INCOME — Serang Pusat', address: 'Jl. Veteran No. 42, Serang', phone: '+62 812-3456-7890', is_open: true },
          { id: 2, name: 'INCOME — Cilegon Branch', address: 'Jl. Ahmad Yani No. 18, Cilegon', phone: '+62 813-9876-5432', is_open: true },
        ];
        setBranches(fallback);
        setSelectedBranch(fallback[0]);
      })
      .finally(() => setLoading(false));

    // 2. Detect Table QR token from URL params (?token=... or ?qr=...)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('qr');
    if (token) {
      api.validateQR(token)
        .then((res) => {
          if (res.table && res.branch) {
            setTableInfo(res.table);
            setSelectedBranch(res.branch);
            localStorage.setItem('income_selected_branch_id', res.branch.id.toString());
            console.log(`[QR-DINEIN] Bound to ${res.branch.name} - ${res.table.table_code}`);
          }
        })
        .catch((err) => {
          console.warn('Invalid QR Token scanned:', err.message);
          setError(`QR Meja tidak valid: ${err.message}`);
        });
    }
  }, []);

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem('income_selected_branch_id', branch.id.toString());
      // If manually changing branch, clear table binding if it belonged to different branch
      if (tableInfo && tableInfo.branch_id !== branch.id) {
        setTableInfo(null);
      }
    }
  };

  const bindTable = (table) => {
    setTableInfo(table);
  };

  const clearTable = () => {
    setTableInfo(null);
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        tableInfo,
        loading,
        error,
        selectBranch,
        bindTable,
        clearTable,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);

