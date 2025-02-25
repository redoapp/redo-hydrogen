import { ReactNode, useState } from "react";
import InfoIcon from "./info.svg";
import ShieldIcon from "./shield-tick.svg";
import { useRedoCoverageClient } from "../providers/redo-coverage-client";

interface RedoInfoModalProps {
  showInfoIcon?: boolean;
  onInfoClick?: () => void;
  fallbackIcon?: ReactNode;
}

const RedoInfoModal = ({ 
  showInfoIcon = true, 
  onInfoClick = () => {}, 
  fallbackIcon
}: RedoInfoModalProps) => {
    const { price } = useRedoCoverageClient();

    return (
        <div className="redo-info-modal" data-target="info-card-container" style={{
            display: 'flex',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            padding: '12px',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px'
        }}>
            <div className="redo-info-modal__imageContainer" style={{
                width: '32px',
                height: '32px',
                borderRadius: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                flexShrink: 0,
                padding: '4px'
            }}>
                <ShieldIcon style={{
                    width: '100%',
                    height: '100%',
                    color: 'black',
                    display: 'block',
                    viewBox: '0 0 24 24',
                }}/>
            </div>
            
            <div className="redo-info-modal__content" data-target="text-and-buttons-container" style={{
                flex: 1
            }}>
                <div className="redo-info-modal__textWrapper" style={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <span className="redo-info-modal__label" data-target="toggle-label" style={{
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
                            <span className="redo-info-modal__infoIconWrapper" data-target="toggle-info">
                                <button
                                    className="redo-info-modal__infoButton"
                                    data-target="toggle-info-button"
                                    onClick={onInfoClick}
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
                                    />
                                </button>
                            </span>
                        )}
                    </span>
                    <span className="redo-info-modal__description" data-target="toggle-subtext" style={{
                        color: '#000000',
                        fontSize: '12px',
                        lineHeight: '16px'
                    }}>
                        Free Returns + Package Protection
                    </span>
                </div>
            </div>
            
            <div className="redo-info-modal__priceContainer" style={{
                color: '#000000',
                fontSize: '14px',
                fontWeight: 400,
            }}>
                <span className="redo-info-modal__price" data-target="price">${price}</span>
            </div>
        </div>
    );
};

export { RedoInfoModal };
