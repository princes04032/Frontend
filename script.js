// Configuration - Replace with your deployed backend URL
const API_BASE_URL = 'https://back-end-lmcrud.onrender.com/API';
// Example: 'https://library-api.onrender.com/api'

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close');
const apiStatus = document.getElementById('apiStatus');
const apiUrl = document.getElementById('apiUrl');

// State
let books = [];
let members = [];
let loans = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set API URL in footer
    apiUrl.textContent = API_BASE_URL;
    
    // Check API connection
    checkApiConnection();
    
    // Set up tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Set up modal close button
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Set up refresh buttons
    document.getElementById('refreshBooks').addEventListener('click', loadBooks);
    document.getElementById('refreshMembers').addEventListener('click', loadMembers);
    document.getElementById('refreshLoans').addEventListener('click', loadLoans);
    
    // Set up search functionality
    document.getElementById('searchBooks').addEventListener('input', filterBooks);
    
    // Set up form submissions
    document.getElementById('createBookForm').addEventListener('submit', createBook);
    document.getElementById('createMemberForm').addEventListener('submit', createMember);
    document.getElementById('createLoanForm').addEventListener('submit', createLoan);
    
    // Load initial data
    loadBooks();
    loadMembers();
    loadLoans();
    
    // Populate dropdowns for loan form
    populateLoanDropdowns();
});

// Tab switching function
function switchTab(tabId) {
    // Update active tab
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show corresponding content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Check API connection
async function checkApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (response.ok) {
            apiStatus.textContent = 'Connected to backend API';
            apiStatus.classList.add('connected');
            apiStatus.classList.remove('disconnected');
        } else {
            throw new Error('API not responding properly');
        }
    } catch (error) {
        apiStatus.textContent = 'Unable to connect to backend API';
        apiStatus.classList.add('disconnected');
        apiStatus.classList.remove('connected');
        console.error('API connection error:', error);
    }
}

// =============== BOOKS FUNCTIONS ===============
async function loadBooks() {
    const booksBody = document.getElementById('booksBody');
    const booksLoading = document.getElementById('booksLoading');
    
    booksBody.innerHTML = '';
    booksLoading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        books = await response.json();
        booksLoading.style.display = 'none';
        
        if (books.length === 0) {
            booksBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No books found in the library</td></tr>';
            return;
        }
        
        books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${book.copies}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editBook('${book._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteBook('${book._id}', '${book.title}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            booksBody.appendChild(row);
        });
    } catch (error) {
        booksLoading.innerHTML = `<span style="color: #e74c3c;">Error loading books: ${error.message}</span>`;
        console.error('Error loading books:', error);
    }
}

function filterBooks() {
    const searchTerm = document.getElementById('searchBooks').value.toLowerCase();
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm)
    );
    
    const booksBody = document.getElementById('booksBody');
    booksBody.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        booksBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No books match your search</td></tr>';
        return;
    }
    
    filteredBooks.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.copies}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editBook('${book._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteBook('${book._id}', '${book.title}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        booksBody.appendChild(row);
    });
}

async function createBook(e) {
    e.preventDefault();
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        copies: parseInt(document.getElementById('bookCopies').value)
    };
    
    // Validation
    if (!bookData.title || !bookData.author || !bookData.isbn) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const newBook = await response.json();
        alert(`Book "${newBook.title}" added successfully!`);
        
        // Reset form
        e.target.reset();
        
        // Refresh books list
        loadBooks();
        populateLoanDropdowns();
        
        // Switch to books tab
        switchTab('books');
    } catch (error) {
        alert(`Error creating book: ${error.message}`);
        console.error('Error creating book:', error);
    }
}

async function editBook(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const book = await response.json();
        
        // Create edit form in modal
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3><i class="fas fa-edit"></i> Edit Book</h3>
            <form id="editBookForm">
                <div class="form-group">
                    <label for="editBookTitle">Title *</label>
                    <input type="text" id="editBookTitle" value="${book.title}" required>
                </div>
                <div class="form-group">
                    <label for="editBookAuthor">Author *</label>
                    <input type="text" id="editBookAuthor" value="${book.author}" required>
                </div>
                <div class="form-group">
                    <label for="editBookISBN">ISBN *</label>
                    <input type="text" id="editBookISBN" value="${book.isbn}" required>
                </div>
                <div class="form-group">
                    <label for="editBookCopies">Copies</label>
                    <input type="number" id="editBookCopies" value="${book.copies}" min="0" required>
                </div>
                <button type="submit" class="btn btn-primary">Update Book</button>
            </form>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle form submission
        document.getElementById('editBookForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                title: document.getElementById('editBookTitle').value,
                author: document.getElementById('editBookAuthor').value,
                isbn: document.getElementById('editBookISBN').value,
                copies: parseInt(document.getElementById('editBookCopies').value)
            };
            
            try {
                const updateResponse = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });
                
                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || `HTTP ${updateResponse.status}`);
                }
                
                const updatedBook = await updateResponse.json();
                alert(`Book "${updatedBook.title}" updated successfully!`);
                
                // Close modal and refresh data
                modal.style.display = 'none';
                loadBooks();
                populateLoanDropdowns();
            } catch (error) {
                alert(`Error updating book: ${error.message}`);
                console.error('Error updating book:', error);
            }
        });
    } catch (error) {
        alert(`Error loading book details: ${error.message}`);
        console.error('Error loading book details:', error);
    }
}

async function deleteBook(bookId, bookTitle) {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        alert(`Book "${bookTitle}" deleted successfully!`);
        
        // Refresh books list
        loadBooks();
        populateLoanDropdowns();
    } catch (error) {
        alert(`Error deleting book: ${error.message}`);
        console.error('Error deleting book:', error);
    }
}

// =============== MEMBERS FUNCTIONS ===============
async function loadMembers() {
    const membersBody = document.getElementById('membersBody');
    const membersLoading = document.getElementById('membersLoading');
    
    membersBody.innerHTML = '';
    membersLoading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/members`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        members = await response.json();
        membersLoading.style.display = 'none';
        
        if (members.length === 0) {
            membersBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">No members found</td></tr>';
            return;
        }
        
        members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.age}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editMember('${member._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteMember('${member._id}', '${member.name}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            membersBody.appendChild(row);
        });
    } catch (error) {
        membersLoading.innerHTML = `<span style="color: #e74c3c;">Error loading members: ${error.message}</span>`;
        console.error('Error loading members:', error);
    }
}

async function createMember(e) {
    e.preventDefault();
    
    const memberData = {
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        age: parseInt(document.getElementById('memberAge').value)
    };
    
    // Validation
    if (!memberData.name || !memberData.email || !memberData.age) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (memberData.age < 1 || memberData.age > 120) {
        alert('Please enter a valid age');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const newMember = await response.json();
        alert(`Member "${newMember.name}" added successfully!`);
        
        // Reset form
        e.target.reset();
        
        // Refresh members list
        loadMembers();
        populateLoanDropdowns();
        
        // Switch to members tab
        switchTab('members');
    } catch (error) {
        alert(`Error creating member: ${error.message}`);
        console.error('Error creating member:', error);
    }
}

async function editMember(memberId) {
    try {
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const member = await response.json();
        
        // Create edit form in modal
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3><i class="fas fa-edit"></i> Edit Member</h3>
            <form id="editMemberForm">
                <div class="form-group">
                    <label for="editMemberName">Name *</label>
                    <input type="text" id="editMemberName" value="${member.name}" required>
                </div>
                <div class="form-group">
                    <label for="editMemberEmail">Email *</label>
                    <input type="email" id="editMemberEmail" value="${member.email}" required>
                </div>
                <div class="form-group">
                    <label for="editMemberAge">Age *</label>
                    <input type="number" id="editMemberAge" value="${member.age}" min="1" max="120" required>
                </div>
                <button type="submit" class="btn btn-primary">Update Member</button>
            </form>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle form submission
        document.getElementById('editMemberForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                name: document.getElementById('editMemberName').value,
                email: document.getElementById('editMemberEmail').value,
                age: parseInt(document.getElementById('editMemberAge').value)
            };
            
            try {
                const updateResponse = await fetch(`${API_BASE_URL}/members/${memberId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });
                
                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || `HTTP ${updateResponse.status}`);
                }
                
                const updatedMember = await updateResponse.json();
                alert(`Member "${updatedMember.name}" updated successfully!`);
                
                // Close modal and refresh data
                modal.style.display = 'none';
                loadMembers();
                populateLoanDropdowns();
            } catch (error) {
                alert(`Error updating member: ${error.message}`);
                console.error('Error updating member:', error);
            }
        });
    } catch (error) {
        alert(`Error loading member details: ${error.message}`);
        console.error('Error loading member details:', error);
    }
}

async function deleteMember(memberId, memberName) {
    if (!confirm(`Are you sure you want to delete "${memberName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        alert(`Member "${memberName}" deleted successfully!`);
        
        // Refresh members list
        loadMembers();
        populateLoanDropdowns();
    } catch (error) {
        alert(`Error deleting member: ${error.message}`);
        console.error('Error deleting member:', error);
    }
}

// =============== LOANS FUNCTIONS ===============
async function loadLoans() {
    const loansBody = document.getElementById('loansBody');
    const loansLoading = document.getElementById('loansLoading');
    
    loansBody.innerHTML = '';
    loansLoading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/loans`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        loans = await response.json();
        loansLoading.style.display = 'none';
        
        if (loans.length === 0) {
            loansBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No active loans found</td></tr>';
            return;
        }
        
        loans.forEach(loan => {
            const loanDate = new Date(loan.loanDate).toLocaleDateString();
            const returnDate = loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : 'Not returned';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.book ? loan.book.title : 'Unknown Book'}</td>
                <td>${loan.member ? loan.member.name : 'Unknown Member'}</td>
                <td>${loanDate}</td>
                <td>${returnDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete-btn" onclick="deleteLoan('${loan._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            loansBody.appendChild(row);
        });
    } catch (error) {
        loansLoading.innerHTML = `<span style="color: #e74c3c;">Error loading loans: ${error.message}</span>`;
        console.error('Error loading loans:', error);
    }
}

async function populateLoanDropdowns() {
    const bookSelect = document.getElementById('loanBook');
    const memberSelect = document.getElementById('loanMember');
    
    // Clear existing options (except the first one)
    bookSelect.innerHTML = '<option value="">Select a book</option>';
    memberSelect.innerHTML = '<option value="">Select a member</option>';
    
    try {
        // Load books with available copies
        const booksResponse = await fetch(`${API_BASE_URL}/books`);
        if (booksResponse.ok) {
            const books = await booksResponse.json();
            books.forEach(book => {
                if (book.copies > 0) {
                    const option = document.createElement('option');
                    option.value = book._id;
                    option.textContent = `${book.title} (${book.copies} available)`;
                    bookSelect.appendChild(option);
                }
            });
        }
        
        // Load members
        const membersResponse = await fetch(`${API_BASE_URL}/members`);
        if (membersResponse.ok) {
            const members = await membersResponse.json();
            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member._id;
                option.textContent = `${member.name} (${member.email})`;
                memberSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating loan dropdowns:', error);
    }
}

async function createLoan(e) {
    e.preventDefault();
    
    const loanData = {
        bookId: document.getElementById('loanBook').value,
        memberId: document.getElementById('loanMember').value
    };
    
    // Validation
    if (!loanData.bookId || !loanData.memberId) {
        alert('Please select both a book and a member');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/loans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loanData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const newLoan = await response.json();
        alert(`Loan created successfully!`);
        
        // Reset form
        e.target.reset();
        
        // Refresh loans list and books list (to update copy counts)
        loadLoans();
        loadBooks();
        populateLoanDropdowns();
        
        // Switch to loans tab
        switchTab('loans');
    } catch (error) {
        alert(`Error creating loan: ${error.message}`);
        console.error('Error creating loan:', error);
    }
}

async function deleteLoan(loanId) {
    if (!confirm('Are you sure you want to delete this loan record?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        alert('Loan deleted successfully!');
        
        // Refresh loans list and books list
        loadLoans();
        loadBooks();
    } catch (error) {
        alert(`Error deleting loan: ${error.message}`);
        console.error('Error deleting loan:', error);
    }
}