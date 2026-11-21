import { Alert, Button, Modal } from "antd";

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SetupWizardModal = ({
  isOpen,
  onClose,
}: SetupWizardModalProps) => (
  <Modal open={isOpen} onCancel={onClose} footer={null} centered>
    <Alert
      type="warning"
      showIcon
      message="Chưa hỗ trợ xác thực hai yếu tố"
      description="Backend hiện chưa cung cấp API để thiết lập xác thực hai yếu tố."
      action={<Button onClick={onClose}>Đóng</Button>}
    />
  </Modal>
);
