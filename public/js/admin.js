document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('confirmModal');
  const confirmMsg = document.getElementById('confirmMessage');
  const deleteForm = document.getElementById('deleteForm');
  const cancelBtn = document.getElementById('cancelDelete');

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      confirmMsg.textContent = `Delete "${name}" from the menu?`;
      deleteForm.action = `/admin/delete-item/${id}`;
      modal.classList.remove('hidden');
    });
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
});
