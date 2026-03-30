import type React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getDomain } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import styles from './DomainPage.module.css';

const DomainPage: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const domain = getDomain(domainId ?? '');

  if (!domain) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h2>Domain not found</h2>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumb items={[
            { label: 'Home', to: '/' },
            { label: domain.name },
          ]} />
        </motion.div>

        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to all domains
        </Link>

        <motion.header
          className={styles.header}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className={styles.domainBadge}
            style={{ borderColor: domain.accentColor, color: domain.accentColor }}
          >
            {domain.name}
          </div>
          <h1 className={styles.title}>{domain.name}</h1>
          <p className={styles.description}>{domain.description}</p>
          <div className={styles.useCaseCount}>
            {domain.useCases.length} use {domain.useCases.length === 1 ? 'case' : 'cases'}
          </div>
        </motion.header>

        <div className={styles.grid}>
          {domain.useCases.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={`/domain/${domainId}/workstation/${useCase.id}`}
                className={styles.card}
                style={{ '--card-accent': domain.accentColor } as React.CSSProperties}
              >
                <div className={styles.cardAccentBar} />
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{useCase.title}</h3>
                  <p className={styles.cardDescription}>{useCase.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardArrow}>
                    <ArrowRight size={14} />
                  </span>
                </div>
                <div className={styles.cardGlow} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DomainPage;
