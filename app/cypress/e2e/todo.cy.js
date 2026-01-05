describe('Todo App Smoke Test', () => {
  // We hit the internal K8s Service name
  const url = 'http://todo-app-service'; 

  it('Checks if app loads', () => {
    cy.request(url + '/health').then((resp) => {
      expect(resp.status).to.eq(200);
    });
  });

  it('Verifies default todo item', () => {
    cy.request(url + '/todos').then((resp) => {
      expect(resp.body[0].task).to.eq('DevSecOps Initialized');
    });
  });
});
