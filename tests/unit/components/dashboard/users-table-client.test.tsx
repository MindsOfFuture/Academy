import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersTableClient from "@/components/dashboard/users-table-client";
import userEvent from "@testing-library/user-event";
import { type UserProfileSummary } from "@/lib/api/types";

// Mocks
// Query builder auto-encadeavel: qualquer metodo devolve o proprio builder,
// que tambem e awaitable. Assim o mock nao quebra quando a query ganha
// um .eq()/.or() novo no componente.
const defaultResult = { data: null, count: 0, error: null };
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockOr = vi.fn();
const mockRange = vi.fn();
const mockIn = vi.fn();
const mockEq = vi.fn();

const query: Record<string, unknown> = {
  select: mockSelect,
  order: mockOrder,
  or: mockOr,
  range: mockRange,
  in: mockIn,
  eq: mockEq,
  then: (resolve: (value: typeof defaultResult) => void) => resolve(defaultResult),
};

const chainMocks = [mockSelect, mockOrder, mockOr, mockRange, mockIn, mockEq];
const mockFrom = vi.fn(() => query);

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
    mockFrom.mockReturnValue(query);
    chainMocks.forEach((mock) => mock.mockReturnValue(query));
  });

  it("renders initial users correctly", () => {
    render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={1} initialPage={1} initialPageSize={10} />);
    
    // Responsive design might render it twice (table + mobile card)
    const elements = screen.getAllByText('Test User');
    expect(elements.length).toBeGreaterThan(0);
  });

  it("busca substitui a lista pelos usuarios retornados", async () => {
     render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={1} initialPage={1} initialPageSize={10} />);
     
     mockRange.mockResolvedValueOnce({
         data: [{ id: '2', full_name: 'Searched User', email: 's@e.com' }],
         count: 1,
         error: null
     });

     await userEvent.type(screen.getByTestId('search-input'), 'Searched');
     
     await waitFor(() => {
         expect(screen.getAllByText('Searched User').length).toBeGreaterThan(0);
     });
     expect(screen.queryByText('Test User')).toBeNull();
  });

  it("paginacao carrega a proxima pagina com o range correto", async () => {
     render(<UsersTableClient {...actions} initialUsers={initialUsers} initialTotal={20} initialPage={1} initialPageSize={10} />);
     
     // Mock return for page 2
     mockRange.mockResolvedValueOnce({
         data: [{ id: '3', full_name: 'Page 2 User', email: 'p2@e.com' }],
         count: 20,
         error: null
     });

     fireEvent.click(screen.getByText('Next'));

     await waitFor(() => {
         expect(screen.getAllByText('Page 2 User').length).toBeGreaterThan(0);
     });
     // range e 0-based: pagina 2 com pageSize 10 -> (10, 19)
     expect(mockRange).toHaveBeenCalledWith(10, 19);
  });
});
