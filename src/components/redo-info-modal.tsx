import { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import InfoIcon from "./icons/info.svg";
import ShieldIcon from "./icons/shield-tick.svg";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";
import FeaturedPackageCheckIcon from "./icons/featured-package-check.svg";
import FeaturedLaptopIcon from "./icons/featured-laptop-2.svg";
import FeaturedRefreshIcon from "./icons/featured-refresh-cw-3.svg";
import RedoLogo from "./icons/logo.svg";
import CloseIcon from "./icons/modal-close-button.svg"


interface RedoInfoModalProps {
    showInfoIcon?: boolean;
    onInfoClick?: () => void;
    infoCardImageUrl?: string;
    infoModalLogoUrl?: string;
    infoModalImageUrl?: string;
    infoModalContent?: ReactNode;
}

function useInjectStyle(styleContent: string) {
    useEffect(() => {
      const styleTag = document.createElement('style');
      styleTag.textContent = styleContent;
      document.head.appendChild(styleTag);
      return () => {
        document.head.removeChild(styleTag);
      };
    }, [styleContent]);
}

const Modal = ({ open, onClose, infoModalLogoUrl, infoModalImageUrl, modalContent }: 
{ 
    open: boolean; 
    onClose: () => void; 
    infoModalLogoUrl?: string; 
    infoModalImageUrl?: string;
    modalContent?: ReactNode;
}) => {
    useInjectStyle( `
        ${fadeInKeyframes}
        ${slideInKeyframes}
        
        @media (max-width: 768px) {
            .redo-info-modal__container {
                flex-direction: column !important;
                align-items: stretch !important;
                overflow: auto !important;
                width: 95% !important;
            }
            
            .redo-info-modal__sideImageContainer {
                width: 100% !important;
                min-width: unset !important;
                max-height: 140px !important;
                overflow: hidden !important;
            }
            
            .redo-info-modal__sideImageContainer img {
                height: 140px !important;
                max-height: 140px !important;
            }
            
            .redo-info-modal__contentContainer {
                width: 100% !important;
                box-sizing: border-box !important;
            }
        }
    `);

    if (!open) return <></>;

    const fullModalContent = (
        <div  className="redo-info-modal__backgroundContainer" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            transform: 'translateZ(0)',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            animation: 'fadeIn 0.2s ease-in-out'
        }} onClick={onClose}>
            <div className="redo-info-modal__container" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '700px',
                maxWidth: '900px',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100000,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'left',
                maxHeight: '95%',
                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                opacity: 1,
                transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
                animation: 'slideIn 0.2s ease-in-out forwards',
                minHeight: '100px',
            }} onClick={e => e.stopPropagation()}>
                    <button
                        className="redo-info-modal__closeButton"
                        onClick={onClose}
                        style={{
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        border: 'none',
                        background: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        zIndex: 1
                    }}
                >
                    <CloseIcon />
                </button>
                {infoModalImageUrl ? (
                    <div className="redo-info-modal__sideImageContainer" style={{
                        minWidth: '200px',
                        width: '200px',
                        backgroundImage: `url(${infoModalImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        alignSelf: 'stretch',
                    }}>
                    </div>  
                ) : null}
                {modalContent ? modalContent : (
                <div className="redo-info-modal__contentContainer" style={{
                    padding: '24px',
                    fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
                }}>
                    <div className="redo-info-modal__logoContainer" style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        {infoModalLogoUrl ? (
                            <img src={infoModalLogoUrl} className="redo-info-modal__logo" style={{
                                width: 'auto',
                                height: '112px',
                                display: 'block',
                            }}/>
                        ) : <RedoLogo width="112px" height="112px" display="block"/>}
                    </div>
                    <p style={{ 
                        fontSize: '20px', 
                        fontWeight: '600'
                    }} className="redo-info-modal__title">
                        Checkout with confidence
                    </p>
                    
                    <p style={{ 
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '24px'
                    }} className="redo-info-modal__description">
                        Shop with confidence, knowing your purchases are protected every step of the way.
                    </p>

                    <div className="redo-info-modal__benefitsContainer" style={{ marginBottom: '24px' }}>
                        <div className="redo-info-modal__benefit" style={{ marginBottom: '16px' }}>
                            <div className="redo-info-modal__benefitIconContainer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '10px' }}>
                                <div className="redo-info-modal__benefitIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                                    <FeaturedRefreshIcon height="32" width="32" />
                                </div>
                                <div className="redo-info-modal__benefitTextContainer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <p className="redo-info-modal__benefitText" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                                        Free returns & exchanges
                                    </p>
                                    <p className="redo-info-modal__benefitSmallText" style={{ fontSize: '12px', color: '#666' }}>
                                        Return or exchange your items for free. If you're not completely satisfied, we've got you covered.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="redo-info-modal__benefit" style={{ marginBottom: '16px' }}>
                            <div className="redo-info-modal__benefitIconContainer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px' }}>
                                <div className="redo-info-modal__benefitIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                                    <FeaturedPackageCheckIcon height="32" width="32" />
                                </div>
                                <div className="redo-info-modal__benefitTextContainer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <p className="redo-info-modal__benefitText" style={{ 
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        marginBottom: '4px'
                                    }}>
                                        Package protection
                                    </p>
                                    <p className="redo-info-modal__benefitSmallText" style={{ 
                                        fontSize: '12px',
                                        color: '#666'
                                    }}>
                                        Rest assured, if your package is lost, stolen, or damaged, we've got you covered.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="redo-info-modal__benefit" style={{ marginBottom: '16px' }}>
                            <div className="redo-info-modal__benefitIconContainer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px' }}>
                                <div className="redo-info-modal__benefitIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                                    <FeaturedLaptopIcon height="32" width="32" />
                                </div>
                                <div className="redo-info-modal__benefitTextContainer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <p className="redo-info-modal__benefitText" style={{ 
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        marginBottom: '4px'
                                    }}>
                                        Easy return portal
                                    </p>
                                    <p className="redo-info-modal__benefitSmallText" style={{ 
                                        fontSize: '12px',
                                        color: '#666'
                                    }}> 
                                        Skip all the back and forth, and submit your return in a few clicks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="redo-info-modal__footerText" style={{ 
                        fontSize: '12px',
                        color: '#666',
                    }}>
                        By purchasing Redo, you agree and have read the{' '}
                        <a 
                            href="https://www.getredo.com/privacy-policy" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#000', textDecoration: 'underline' }}
                        >Privacy Policy</a> and{' '}
                        <a 
                            href="https://www.getredo.com/terms-conditions" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#000', textDecoration: 'underline' }}
                        >Terms and Conditions</a>.
                        {' '}Redo is subject to Merchant's Return Policy.
                    </p>
                </div>
                )}
            </div>
        </div>
    );

    return createPortal(fullModalContent, document.body);
};

const RedoInfoCard = ({ 
    showInfoIcon = true, 
    onInfoClick,
    infoCardImageUrl,
    infoModalLogoUrl,
    infoModalImageUrl,
    infoModalContent,
}: RedoInfoModalProps) => {
    const { price, eligible } = useRedoCoverageClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleInfoClick = () => {
        if (onInfoClick) {
            onInfoClick();
        } else {
            setIsModalOpen(true);
        }
    };

    if (!eligible) { 
        return <></>;
    }

    return (
        <>
            <div className="redo-info-card__container" data-target="info-card-container" style={{
                display: 'flex',
                borderRadius: '4px',
                padding: '12px',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px'
            }}>
                <div className="redo-info-card__imageContainer" style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    {infoCardImageUrl ? (
                        <img src={infoCardImageUrl} alt="Redo Info" className="redo-info-card__image" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }} />
                    ) : (
                        <ShieldIcon style={{
                            width: '100%',
                            height: '100%',
                            color: 'black',
                            display: 'block',
                            viewBox: '0 0 24 24',
                        }}/>
                    )}
                </div>
                
                <div className="redo-info-card__content" data-target="text-and-buttons-container" style={{
                    flex: 1
                }}>
                    <div className="redo-info-card__textWrapper" style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <span className="redo-info-card__title" data-target="toggle-label" style={{
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            verticalAlign: 'middle'
                        }}>
                            Checkout+
                            {showInfoIcon && (
                                <span className="redo-info-card__infoIconWrapper" data-target="toggle-info">
                                    <button
                                        className="redo-info-card__infoButton"
                                        data-target="toggle-info-button"
                                        onClick={handleInfoClick}
                                        type="button"
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            color: '#969696',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <InfoIcon 
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                verticalAlign: 'middle'
                                            }}
                                            className="redo-info-card__infoIcon"
                                        />
                                    </button>
                                </span>
                            )}
                        </span>
                        <p className="redo-info-card__subtext" data-target="toggle-subtext" style={{
                            color: '#000000',
                            fontSize: '12px',
                            lineHeight: '16px'
                        }}>
                            Free Returns + Package Protection
                        </p>
                    </div>
                </div>
                
                <div className="redo-info-card__priceContainer">
                    <p  style={{
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: 400,
                }} className="redo-info-card__price" data-target="price">${price}</p>
                </div>
            </div>
            
            {!onInfoClick && (
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    infoModalLogoUrl={infoModalLogoUrl}
                    infoModalImageUrl={infoModalImageUrl}
                    modalContent={infoModalContent}
                />
            )}
        </>
    );
};

const fadeInKeyframes = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

const slideInKeyframes = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -48%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }
`;



export { RedoInfoCard };