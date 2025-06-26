import React from 'react';
import { Modal } from 'antd';
import styles from './share.module.css';
import { 
    QuestionCircleOutlined, 
    PlusOutlined, 
    LinkOutlined, 
    GlobalOutlined, 
    QrcodeOutlined,
    WechatOutlined,
} from '@ant-design/icons';
interface ShareDocumentProps {
    open: boolean;
    onCancel: () => void;
}
const CollaboratorAvatar = ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} className={styles.avatar} />
);

const ShareDocument: React.FC<ShareDocumentProps> = ({ open, onCancel }) => {
    const collaborators = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&q=80',
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&q=80'
    ];

    return (
        <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        title={null}
        closable={true}
        styles={{ body: { padding: 0 } }}
        width={570}
        // styles={{ body: { background: 'none', boxShadow: 'none', padding: 0 } }}
        
    >
        <div className={styles.shareContainer}>
            <div className={styles.header}>
                <div className={styles.title}>
                    分享文档
                    <QuestionCircleOutlined className={styles.helpIcon} />
                </div>
                {/* <button className={styles.permissionButton}>申请编辑权限</button> */}
            </div>

            <div className={styles.inviteSection}>
                <div className={styles.inviteHeader}>
                    <label className={styles.sectionLabel}>邀请协作者</label>
                    <div className={styles.collaborators}>
                        {collaborators.map((src, index) => (
                            <CollaboratorAvatar key={index} src={src} alt={`collaborator ${index + 1}`} />
                        ))}
                        <div className={`${styles.avatar} ${styles.moreCollaborators}`}>+10</div>
                    </div>
                </div>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder="搜索用户、群组、部门或用户组"
                        className={styles.searchInput}
                    />
                    <button className={styles.addButton}>
                        <PlusOutlined />
                    </button>
                </div>
            </div>

            <div className={styles.linkShareSection}>
                <label className={styles.sectionLabel}>链接分享</label>
                <div className={styles.linkStatus}>
                    <div className={styles.linkStatusIconWrapper}>
                        <div className={styles.linkStatusIcon}>
                            <GlobalOutlined style={{ fontSize: '22px', color: '#3370ff' }} />
                        </div>
                    </div>
                    <div className={styles.linkStatusText}>
                        <p className={styles.status}>互联网获得链接的人</p>
                        <p className={styles.description}>互联网获得链接的人可阅读</p>
                    </div>
                    <button className={styles.linkPermission}>可阅读</button>
                </div>
            </div>

            <div className={styles.footer}>
                <button className={styles.copyLinkButton}>
                    <LinkOutlined />
                    复制链接
                </button>
                <div className={styles.shareIcons}>
                    <button className={styles.iconButton}><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/lcy_fq/document-icon/feishu.svg" alt="feishu" style={{ width: 20, height: 20 }} /></button>
                    <button className={styles.iconButton}><WechatOutlined style={{ fontSize: '20px' }} /></button>
                    <button className={styles.iconButton}><QrcodeOutlined style={{ fontSize: '20px' }} /></button>
                    <button className={styles.iconButton}><LinkOutlined style={{ fontSize: '20px' }} /></button>
                </div>
            </div>
        </div>
        </Modal>
    );
};

export default ShareDocument;
