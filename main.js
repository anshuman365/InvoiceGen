// API Configuration - UPDATE THIS WITH YOUR PYTHONANYWHERE URL
const API_BASE_URL = 'https://anshuman365.pythonanywhere.com/api';

// Authentication functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        throw error;
    }
}

async function register(company_name, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ company_name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        throw error;
    }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// Invoice functions
async function createInvoice(invoiceData) {
    return await apiRequest('/invoices', {
        method: 'POST',
        body: invoiceData
    });
}

async function getInvoices() {
    return await apiRequest('/invoices');
}

async function getInvoice(invoiceId) {
    return await apiRequest(`/invoices/${invoiceId}`);
}

async function deleteInvoice(invoiceId) {
    return await apiRequest(`/invoices/${invoiceId}`, {
        method: 'DELETE'
    });
}

// NEW: Update invoice status
async function updateInvoiceStatus(invoiceId, status) {
    return await apiRequest(`/invoices/${invoiceId}/status`, {
        method: 'PUT',
        body: { status }
    });
}

// NEW: Send invoice to client
async function sendInvoiceToClient(invoiceId, clientEmail = null) {
    const payload = {};
    if (clientEmail) {
        payload.client_email = clientEmail;
    }
    
    return await apiRequest(`/invoices/${invoiceId}/send`, {
        method: 'POST',
        body: payload
    });
}

// NEW: Get invoice statistics
async function getInvoiceStatistics() {
    return await apiRequest('/invoices/statistics');
}

// User functions
async function getUser() {
    return await apiRequest('/user');
}

async function updateUserSettings(settings) {
    return await apiRequest('/user/settings', {
        method: 'PUT',
        body: settings
    });
}

// Billing functions
async function addFunds(amount) {
    return await apiRequest('/billing/add-funds', {
        method: 'POST',
        body: { amount }
    });
}

async function upgradePremium() {
    return await apiRequest('/billing/upgrade-premium', {
        method: 'POST'
    });
}

// Payment functions
async function createPaymentOrder(amount, paymentType) {
    return await apiRequest('/payments/create-order', {
        method: 'POST',
        body: {
            amount: amount,
            type: paymentType
        }
    });
}

async function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentType, amount) {
    return await apiRequest('/payments/verify', {
        method: 'POST',
        body: {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            payment_type: paymentType,
            amount: amount
        }
    });
}

// Currency conversion
async function convertCurrency(amount, fromCurrency, toCurrency) {
    return await apiRequest('/convert-currency', {
        method: 'POST',
        body: {
            amount,
            from_currency: fromCurrency,
            to_currency: toCurrency
        }
    });
}

// Check authentication
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatCurrency(amount, currency = 'USD') {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CNY': '¥',
        'CHF': 'CHF',
        'SGD': 'S$'
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// PDF download function
async function downloadInvoicePDF(invoiceId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download PDF');
        }

        // Convert response to blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice_${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Export functions for use in other files
window.api = {
    login,
    register,
    createInvoice,
    getInvoices,
    getInvoice,
    deleteInvoice,
    updateInvoiceStatus,        // NEW
    sendInvoiceToClient,        // NEW
    getInvoiceStatistics,       // NEW
    getUser,
    updateUserSettings,
    addFunds,
    upgradePremium,
    convertCurrency,
    isAuthenticated,
    getCurrentUser,
    logout,
    showAlert,
    formatDate,
    downloadInvoicePDF,
    formatCurrency,
    createPaymentOrder,
    verifyPayment,
    API_BASE_URL: API_BASE_URL
};