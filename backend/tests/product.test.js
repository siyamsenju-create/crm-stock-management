// Test for getToken function

const getToken = () => {
    // Fixed email format to match User model regex
    const email = `test.admin.${Date.now()}@example.com`;
    // Assertions and additional test logic
    expect(email).toMatch(/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/);
};

test('getToken returns valid email', () => {
    getToken();
});