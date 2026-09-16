import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Printer,
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  X,
  Edit,
  Building,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Documents() {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected document for preview / printing
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [statusEditDoc, setStatusEditDoc] = useState(null);
  const [newStatus, setNewStatus] = useState('PROCESSING_EXCISE');
  const [statusNotes, setStatusNotes] = useState('');

  const docTypeLabels = {
    SALES_CERTIFICATE: 'Sales Certificate',
    DELIVERY_LETTER_GATE_PASS: 'Delivery Letter / Gate Pass',
    BOOK_TRANSFER_REQUEST: 'Book Transfer Request',
    ALLOTMENT_LETTER: 'Vehicle Allotment Letter',
    REGISTRATION_APPLICATION: 'Excise Registration Application'
  };

  const statusLabels = {
    PENDING_MANUFACTURER: { label: 'Pending from Honda Atlas', badge: 'badge-rose' },
    PROCESSING_EXCISE: { label: 'Processing at Excise Office', badge: 'badge-amber' },
    READY_FOR_PICKUP: { label: 'Ready for Customer Pickup', badge: 'badge-cyan' },
    DELIVERED: { label: 'Delivered to Customer', badge: 'badge-emerald' }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (docTypeFilter) params.docType = docTypeFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getDocuments(params);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, docTypeFilter, searchQuery]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusEditDoc) return;
    try {
      await api.updateDocStatus(statusEditDoc.id, {
        paperworkStatus: newStatus,
        statusNotes: statusNotes
      });
      setStatusEditDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.message || 'Failed to update paperwork status');
    }
  };

  // Compute pipeline stage counts
  const stageCounts = {
    PENDING_MANUFACTURER: documents.filter(d => d.paperworkStatus === 'PENDING_MANUFACTURER').length,
    PROCESSING_EXCISE: documents.filter(d => d.paperworkStatus === 'PROCESSING_EXCISE').length,
    READY_FOR_PICKUP: documents.filter(d => d.paperworkStatus === 'READY_FOR_PICKUP').length,
    DELIVERED: documents.filter(d => d.paperworkStatus === 'DELIVERED').length
  };

  const renderOfficialLetterContent = (doc) => {
    const sale = doc.sale;
    const bike = sale?.bike;

    switch (doc.docType) {
      case 'SALES_CERTIFICATE':
        return (
          <div className="letter-body">
            <h2 className="letter-title">CERTIFICATE OF SALE</h2>
            <p className="letter-ref">Certificate Ref: ASC-{doc.id.substring(0, 8).toUpperCase()}</p>
            <p className="letter-para">
              This is to officially certify that the brand new motorcycle described herein has been sold and delivered
              by <strong>AutoSuite Motorcycles (Pvt) Ltd</strong>, authorized dealership of Honda Atlas / OEM, to:
            </p>
            <div className="letter-table-box">
              <table className="doc-table">
                <tbody>
                  <tr><td width="32%"><strong>Purchaser Name:</strong></td><td>{sale?.customerName}</td></tr>
                  <tr><td><strong>Father / Guardian Name:</strong></td><td>Record on File</td></tr>
                  <tr><td><strong>Purchaser CNIC / ID:</strong></td><td>{sale?.customerCnic || 'N/A'}</td></tr>
                  <tr><td><strong>Residential Address:</strong></td><td>{sale?.customerAddress || 'Showroom Record'}</td></tr>
                  <tr><td><strong>Sales Invoice Number:</strong></td><td>{sale?.invoiceNumber}</td></tr>
                  <tr><td><strong>Make & Model:</strong></td><td>{bike?.modelName}</td></tr>
                  <tr><td><strong>Frame / Chassis Number:</strong></td><td><strong className="font-mono">{bike?.chassisNumber}</strong></td></tr>
                  <tr><td><strong>Engine Number:</strong></td><td><strong className="font-mono">{bike?.engineNumber}</strong></td></tr>
                  <tr><td><strong>Color & Model Year:</strong></td><td>{bike?.color} ({bike?.modelYear})</td></tr>
                  <tr><td><strong>Sale Price (PKR):</strong></td><td>PKR {Number(sale?.finalAmount || 0).toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="letter-para mt-4">
              The said motorcycle is free from all encumbrances and liens, and the purchaser is the sole and absolute owner of this vehicle.
            </p>
          </div>
        );

      case 'DELIVERY_LETTER_GATE_PASS':
        return (
          <div className="letter-body">
            <h2 className="letter-title">DELIVERY ORDER & SHOWROOM GATE PASS</h2>
            <p className="letter-ref">Gate Pass #: GP-{doc.id.substring(0, 8).toUpperCase()}</p>
            <p className="letter-para">
              <strong>TO THE CHIEF SECURITY OFFICER / SHOWROOM WAREHOUSE:</strong><br />
              Please allow gate exit and physical delivery of the vehicle listed below to the customer against invoice: <strong>{sale?.invoiceNumber}</strong>.
            </p>
            <div className="letter-table-box">
              <table className="doc-table">
                <tbody>
                  <tr><td width="32%"><strong>Customer Name:</strong></td><td>{sale?.customerName} ({sale?.customerPhone})</td></tr>
                  <tr><td><strong>Model Description:</strong></td><td>{bike?.modelName} - {bike?.color}</td></tr>
                  <tr><td><strong>Chassis Number:</strong></td><td><strong className="font-mono">{bike?.chassisNumber}</strong></td></tr>
                  <tr><td><strong>Engine Number:</strong></td><td><strong className="font-mono">{bike?.engineNumber}</strong></td></tr>
                  <tr><td><strong>Accessories Handed Over:</strong></td><td>2x Ignition Keys, Warranty Handbook, Tool Kit, Battery Pre-charged</td></tr>
                  <tr><td><strong>PDI Inspector:</strong></td><td>Inspection Passed (Showroom Workshop Lead)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="letter-para mt-4">
              I, the purchaser, have personally inspected the vehicle and received it in 100% satisfactory condition without any scratches or mechanical defects.
            </p>
          </div>
        );

      case 'BOOK_TRANSFER_REQUEST':
        return (
          <div className="letter-body">
            <h2 className="letter-title">APPLICATION FOR REGISTRATION BOOK / SMART CARD TRANSFER</h2>
            <p className="letter-ref">Reference: BTR-{doc.id.substring(0, 8).toUpperCase()}</p>
            <p className="letter-para">
              <strong>To: The Motor Registering Authority / Excise & Taxation Officer</strong><br />
              Sir,<br />
              It is respectfully requested that the ownership and registration book of the following motor vehicle be transferred in favor of the applicant:
            </p>
            <div className="letter-table-box">
              <table className="doc-table">
                <tbody>
                  <tr><td width="32%"><strong>Transferee (Buyer):</strong></td><td>{sale?.customerName} (CNIC: {sale?.customerCnic || 'N/A'})</td></tr>
                  <tr><td><strong>Vehicle Make:</strong></td><td>{bike?.modelName}</td></tr>
                  <tr><td><strong>Chassis Number:</strong></td><td><strong className="font-mono">{bike?.chassisNumber}</strong></td></tr>
                  <tr><td><strong>Engine Number:</strong></td><td><strong className="font-mono">{bike?.engineNumber}</strong></td></tr>
                  <tr><td><strong>Registration Mark:</strong></td><td>{bike?.registrationNumber || 'Fresh Registration Application'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'ALLOTMENT_LETTER':
        return (
          <div className="letter-body">
            <h2 className="letter-title">VEHICLE ALLOTMENT & INVOICE LETTER</h2>
            <p className="letter-ref">Allotment Ref: AL-{doc.id.substring(0, 8).toUpperCase()}</p>
            <p className="letter-para">
              Dear <strong>{sale?.customerName}</strong>,<br />
              We take pleasure in informing you that your booking for <strong>{bike?.modelName}</strong> has been allocated from our factory shipment batch.
            </p>
            <div className="letter-table-box">
              <table className="doc-table">
                <tbody>
                  <tr><td width="32%"><strong>Chassis Number:</strong></td><td><strong className="font-mono">{bike?.chassisNumber}</strong></td></tr>
                  <tr><td><strong>Engine Number:</strong></td><td><strong className="font-mono">{bike?.engineNumber}</strong></td></tr>
                  <tr><td><strong>Color Scheme:</strong></td><td>{bike?.color}</td></tr>
                  <tr><td><strong>Dealer Code:</strong></td><td>AUTOSUITE-LHR-004</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="letter-body">
            <h2 className="letter-title">MOTOR VEHICLE REGISTRATION APPLICATION (FORM-F)</h2>
            <p className="letter-ref">Excise Ref: REG-{doc.id.substring(0, 8).toUpperCase()}</p>
            <p className="letter-para">
              Application for registration of a new motor vehicle under Motor Vehicles Ordinance:
            </p>
            <div className="letter-table-box">
              <table className="doc-table">
                <tbody>
                  <tr><td width="32%"><strong>Applicant:</strong></td><td>{sale?.customerName}</td></tr>
                  <tr><td><strong>National ID:</strong></td><td>{sale?.customerCnic}</td></tr>
                  <tr><td><strong>Chassis Number:</strong></td><td>{bike?.chassisNumber}</td></tr>
                  <tr><td><strong>Engine Number:</strong></td><td>{bike?.engineNumber}</td></tr>
                  <tr><td><strong>Seating Capacity:</strong></td><td>2 Persons</td></tr>
                  <tr><td><strong>Unladen Weight:</strong></td><td>110 kg</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  if (statusEditDoc) {
    return (
      <div className="documents-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setStatusEditDoc(null)}>
              <ArrowLeft size={16} /> Back to Documents
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Update Paperwork Status</h2>
              <div className="page-form-subtitle">Track excise registration progress, smart card dispatch, and customer handover</div>
            </div>
          </div>

          <form onSubmit={handleUpdateStatus} className="page-form-container narrow">
            <div className="page-form-card">
              <div className="page-form-card-title">Document Reference</div>

              <div className="pricing-box glass-panel mb-2">
                <div><strong>Document:</strong> {docTypeLabels[statusEditDoc.docType]}</div>
                <div><strong>Customer:</strong> {statusEditDoc.sale?.customerName}</div>
                <div><strong>Chassis:</strong> <span className="font-mono text-cyan font-bold">{statusEditDoc.sale?.bike?.chassisNumber}</span></div>
              </div>

              <div className="form-field">
                <label>Registration Lifecycle Stage *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="PENDING_MANUFACTURER">Pending from Honda Atlas / Factory</option>
                  <option value="PROCESSING_EXCISE">Processing at Excise Office</option>
                  <option value="READY_FOR_PICKUP">Ready for Customer Pickup</option>
                  <option value="DELIVERED">Delivered to Customer</option>
                </select>
              </div>

              <div className="form-field">
                <label>Progress Notes / Tracking Reference</label>
                <textarea
                  rows="4"
                  placeholder="e.g. Challan paid, Smart Card batch expected from Lahore Excise on Friday..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStatusEditDoc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Save Progress Update
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-view">
      {/* Registration Pipeline Overview */}
      <div className="kpi-grid no-print mb-2">
        <div
          className={`kpi-card glass-panel cursor-pointer ${statusFilter === 'PENDING_MANUFACTURER' ? 'stage-rose' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING_MANUFACTURER' ? '' : 'PENDING_MANUFACTURER')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Factory Pipeline</span>
            <div className="kpi-icon icon-rose"><Building size={20} /></div>
          </div>
          <div className="kpi-value">{stageCounts.PENDING_MANUFACTURER} <span className="value-unit">Pending</span></div>
          <div className="kpi-footer">
            <span className="badge-rose glass-badge">From OEM Depot</span>
          </div>
        </div>

        <div
          className={`kpi-card glass-panel cursor-pointer ${statusFilter === 'PROCESSING_EXCISE' ? 'stage-amber' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'PROCESSING_EXCISE' ? '' : 'PROCESSING_EXCISE')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Excise Office</span>
            <div className="kpi-icon icon-amber"><Clock size={20} /></div>
          </div>
          <div className="kpi-value">{stageCounts.PROCESSING_EXCISE} <span className="value-unit">In Process</span></div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">Registration Smart Cards</span>
          </div>
        </div>

        <div
          className={`kpi-card glass-panel cursor-pointer ${statusFilter === 'READY_FOR_PICKUP' ? 'stage-cyan' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'READY_FOR_PICKUP' ? '' : 'READY_FOR_PICKUP')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Ready for Delivery</span>
            <div className="kpi-icon icon-cyan"><CheckCircle2 size={20} /></div>
          </div>
          <div className="kpi-value">{stageCounts.READY_FOR_PICKUP} <span className="value-unit">Showroom Ready</span></div>
          <div className="kpi-footer">
            <span className="badge-cyan glass-badge">Gate Pass Available</span>
          </div>
        </div>

        <div
          className={`kpi-card glass-panel cursor-pointer ${statusFilter === 'DELIVERED' ? 'stage-emerald' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'DELIVERED' ? '' : 'DELIVERED')}
        >
          <div className="kpi-header">
            <span className="kpi-title">Completed Documents</span>
            <div className="kpi-icon icon-emerald"><Truck size={20} /></div>
          </div>
          <div className="kpi-value">{stageCounts.DELIVERED} <span className="value-unit">Delivered</span></div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">Archived & Handed Over</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar glass-panel no-print">
        <div className="filter-group">
          <select
            className="filter-select"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
          >
            <option value="">Document Template: All</option>
            <option value="SALES_CERTIFICATE">Sales Certificate</option>
            <option value="DELIVERY_LETTER_GATE_PASS">Delivery Letter / Gate Pass</option>
            <option value="BOOK_TRANSFER_REQUEST">Book Transfer Request</option>
            <option value="ALLOTMENT_LETTER">Allotment Letter</option>
            <option value="REGISTRATION_APPLICATION">Registration Application</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Paperwork Status: All</option>
            <option value="PENDING_MANUFACTURER">Pending from Honda Atlas</option>
            <option value="PROCESSING_EXCISE">Processing at Excise Office</option>
            <option value="READY_FOR_PICKUP">Ready for Customer Pickup</option>
            <option value="DELIVERED">Delivered to Customer</option>
          </select>
        </div>

        <div className="action-group">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Invoice, Chassis, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="card glass-panel no-print">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Document Template</th>
                <th>Vehicle & Chassis No</th>
                <th>Customer Name</th>
                <th>Lifecycle Status</th>
                <th>Progress Notes</th>
                <th>Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    <div className="spinner"></div> Loading vehicle documents...
                  </td>
                </tr>
              ) : documents.length > 0 ? (
                documents.map((doc) => {
                  const statusInfo = statusLabels[doc.paperworkStatus] || { label: doc.paperworkStatus, badge: 'badge-muted' };
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="font-bold text-cyan">
                          {docTypeLabels[doc.docType] || doc.docType}
                        </div>
                        <span className="font-mono text-muted text-xs">
                          Inv: {doc.sale?.invoiceNumber}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-main">{doc.sale?.bike?.modelName}</div>
                        <div className="font-mono text-cyan text-xs">
                          CH: {doc.sale?.bike?.chassisNumber}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-main">{doc.sale?.customerName}</div>
                        <div className="text-muted text-xs">{doc.sale?.customerPhone}</div>
                      </td>
                      <td>
                        <span className={`glass-badge ${statusInfo.badge}`}>
                          {doc.paperworkStatus === 'DELIVERED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="text-muted text-xs max-w-xs">
                        {doc.statusNotes || 'Standard processing lifecycle.'}
                      </td>
                      <td className="text-muted text-xs font-mono">
                        {new Date(doc.updatedAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            className="btn-action-icon"
                            onClick={() => setSelectedDoc(doc)}
                            title="Preview & Print Official Letter"
                          >
                            <Printer size={15} />
                          </button>
                          {hasPermission('MANAGE_DOCS') && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setStatusEditDoc(doc);
                                setNewStatus(doc.paperworkStatus);
                                setStatusNotes(doc.statusNotes || '');
                              }}
                              title="Update Progress Status"
                            >
                              <Edit size={13} /> Update
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-placeholder">No documents found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Letter Preview */}
      {selectedDoc && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel modal-lg">
            <div className="modal-header no-print">
              <h3>{docTypeLabels[selectedDoc.docType]} - Printable Letterhead</h3>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={16} /> Print Official Letter
                </button>
                <button className="close-btn" onClick={() => setSelectedDoc(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="printable-document official-letterhead-sheet">
              {/* Dealership Letterhead */}
              <div className="letterhead-header">
                <div className="letterhead-logo">
                  <h1>AUTOSUITE MOTORCYCLES</h1>
                  <p>3S AUTHORIZED DEALERSHIP: SALES • SERVICE • GENUINE SPARE PARTS</p>
                  <p className="text-xs">Main Showroom Boulevard, Lahore | Phone: 042-35990000</p>
                </div>
                <div className="letter-ref-box">
                  <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                  <div><strong>Chassis:</strong> {selectedDoc.sale?.bike?.chassisNumber}</div>
                </div>
              </div>

              <hr className="doc-divider" />

              {/* Dynamic Letter Body */}
              {renderOfficialLetterContent(selectedDoc)}

              {/* Official Seal and Signatures */}
              <div className="letter-footer mt-8">
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <div>Customer / Transferee Signature</div>
                </div>

                <div className="seal-round">
                  <span>AUTOSUITE</span>
                  <span>OFFICIAL</span>
                  <span>DEALERSHIP</span>
                </div>

                <div className="sig-block">
                  <div className="sig-line"></div>
                  <div>Authorized Signatory & Stamp</div>
                  <div className="text-xs text-muted">AutoSuite Motorcycles Lahore</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}