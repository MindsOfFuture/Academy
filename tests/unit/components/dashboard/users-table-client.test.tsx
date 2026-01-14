import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersTableClient from "@/components/dashboard/users-table-client";
import userEvent from "@testing-library/user-event";
import { type UserProfileSummary } from "@/lib/api/types";

// Mocks
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockOr = vi.fn();
const mockRange = vi.fn();
const mockIn = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock child components to isolate behavior or reduce noise
vi.mock("@/components/dashboard/users-search", () => ({
  UsersSearch: ({ value, onChange }: any) => (
    <input 
      data-testid="search-input" 
      value={value} 
      onChange={(e) => {
          onChange(e.target.value);
      }} 
    />
  ),
}));

vi.mock("@/components/dashboard/users-pagination", () => ({
  UsersPagination: ({ page, total, pageSize, onChangePage }: any) => (
    <div>
        <span data-testid="page-info">Page {page}</span>
        <button onClick={() => onChangePage(page + 1)}>Next</button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/user-edit-modal", () => ({
    UserEditModal: () => <div data-testid="edit-modal">Edit Modal</div>
}));
vi.mock("@/components/dashboard/user-delete-confirm-modal", () => ({
    UserDeleteConfirmModal: () => <div data-testid="delete-modal">Delete Modal</div>
}));


describe("UsersTableClient", () => {
    const initialUsers: UserProfileSummary[] = [
        {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            avatarUrl: null,
            bio: null,
            isActive: true,
            role: 'student'
        }
    ];

    const actions = {
        deleteUserAction: vi.fn(),
        updateUserAction: vi.fn()
    };
    
  beforeEach(() => {
    vi.clearAllMocks();

    // Supabase Chain Setup
    mockFrom.mockReturnValue({
        select: mockSelect,
    });
    
    // For primary user query
    mockSelect.mockReturnValue({
        order: mockOrder,
        in: mockIn // for role query
    });
    
    mockOrder.mockReturnValue({
        range: mockRange,
        or: mockOr
    });
    
    mockOr.mockReturnValue({
        range: mockRange
    });
  });

  it("renders initial users correctly", () => {
    render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={1} initialPage={1} initialPageSize={10} />);
    
    // Responsive design might render it twice (table + mobile card)
    const elements = screen.getAllByText('Test User');
    expect(elements.length).toBeGreaterThan(0);
  });

  it("triggers search and calls supabase", async () => {
     render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={1} initialPage={1} initialPageSize={10} />);
     
     // Mock return for search query
     mockRange.mockResolvedValueOnce({
         data: [{ id: '2', full_name: 'Searched User', email: 's@e.com' }],
         count: 1,
         error: null
     });
     
     // Mock return for role query (secondary)
     mockIn.mockResolvedValueOnce({ data: [] });

     const searchInput = screen.getByTestId('search-input');
     await userEvent.type(searchInput, 'Searched');
     
     await waitFor(() => {
         expect(mockFrom).toHaveBeenCalledWith('user_profile');
         expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('Searched'));
     });
  });

  it("handles pagination and calls supabase", async () => {
     render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={20} initialPage={1} initialPageSize={10} />);
     
     // Mock return for page 2
     mockRange.mockResolvedValueOnce({
         data: [{ id: '3', full_name: 'Page 2 User', email: 'p2@e.com' }],
         count: 20,
         error: null
     });
     
     // Mock return for role query
     mockIn.mockResolvedValueOnce({ data: [] });

     const nextButton = screen.getByText('Next');
     fireEvent.click(nextButton);

     await waitFor(() => {
         expect(mockFrom).toHaveBeenCalledWith('user_profile');
         expect(mockRange).toHaveBeenCalledWith(10, 19); // 1-based page 2 -> skip 10
     });
  });
});
