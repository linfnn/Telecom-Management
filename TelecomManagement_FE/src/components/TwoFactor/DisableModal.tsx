import { Alert, Button, Modal } from "antd";

interface DisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisableModal = ({ isOpen, onClose }: DisableModalProps) => (
  <Modal open={isOpen} onCancel={onClose} footer={null} centered>
    <Alert
      type="warning"
      showIcon
      message="Chưa hỗ trợ xác thực hai yếu tố"
      description="Backend hiện chưa cung cấp API để bật hoặc tắt xác thực hai yếu tố."
      action={<Button onClick={onClose}>Đóng</Button>}
    />
  </Modal>
);
