import React, { useState, useCallback } from 'react';
import * as mammoth from 'mammoth';
import { Editor } from '@tinymce/tinymce-react';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { faker } from '@faker-js/faker/locale/pt_BR';

// definindo interfaces
interface CertificateTemplate {
  title: string;
  actType: string;
  file: File;
  htmlTemplate: string;
  variables: string[];
}

// funcao para formatar datas no formato extenso
const formatDateToExtenso = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  // Adiciona o fuso horário para evitar problemas de um dia a menos
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};


// simulação de busca no banco de dados
const fetchCertificateDataFromApi = (id: string): Promise<any> => {
  console.log(`Simulando busca no banco de dados para o ID: ${id}...`);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === '12345') {
        const databaseData = {
          nome_completo_registrado: 'Ana Carolina de Souza',
          data_nascimento: '2002-03-15T00:00:00.000Z',
          cidade_nascimento: 'Goiânia',
          uf_cartorio: 'GO',
          nome_pai: 'Marcos de Souza',
          nome_mae: 'Helena Pereira de Souza',
          avos_paternos: 'João de Souza e Maria de Souza',
          avos_maternos: 'Carlos Pereira e Lúcia Pereira',
          matricula: '0987654321098765',
          livro: 'A-123',
          folha: '456',
          data_emissao: '2025-07-22T00:00:00.000Z',
          nome_oficial: 'Carlos Eduardo Nogueira',
          cargo_oficial: 'Oficial de Registro Civil'
        };
        resolve(databaseData);
      }
      else if (id === '123456') {
        const weddingData = {
          nome_contraente_1: 'Ricardo Almeida Gomes',
          nome_contraente_2: 'Juliana Martins Ferreira',
          termo: '98765',
          livro: 'B-045',
          folha: '112',
          nacionalidade_contraente_1: 'Brasileiro',
          nascimento_contraente_1: '1990-05-22T00:00:00.000Z',
          profissao_contraente_1: 'Engenheiro Civil',
          cpf_contraente_1: '111.222.333-44',
          residencia_contraente_1: 'Rua das Acácias, 789, Setor Bueno, Goiânia-GO',
          nacionalidade_contraente_2: 'Brasileira',
          nascimento_contraente_2: '1992-09-10T00:00:00.000Z',
          profissao_contraente_2: 'Arquiteta',
          cpf_contraente_2: '555.666.777-88',
          residencia_contraente_2: 'Rua das Acácias, 789, Setor Bueno, Goiânia-GO',
          data_casamento: '2024-10-18T16:30:00.000Z',
          cidade_casamento: 'Goiânia',
          uf_casamento: 'GO',
          regime_bens: 'Comunhão Parcial de Bens',
          nome_apos_casamento_1: 'Ricardo Almeida Gomes',
          nome_apos_casamento_2: 'Juliana Martins Ferreira Gomes',
          cidade_emissao: 'Goiânia',
          data_emissao: '2025-07-22T00:00:00.000Z',
          nome_oficial: 'Carlos Eduardo Nogueira',
          cargo_oficial: 'Oficial de Registro Civil'
        };
        resolve(weddingData);
      }
      else {
        reject(new Error('Registro não encontrado no banco de dados.'));
      }
    }, 1000);
  });
};


const App: React.FC = () => {
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [finalDocumentHtml, setFinalDocumentHtml] = useState<string>('');
  const [currentView, setCurrentView] = useState<'upload' | 'form' | 'editor'>('upload');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [searchId, setSearchId] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const usuarios = [
    { id: 1, nome: "Carlos Nogueira" },
    { id: 2, nome: "Juliana Ferreira" },
    { id: 3, nome: "Marcos Almeida" }
  ];
  const [usuarioAtual, setUsuarioAtual] = useState(usuarios[0]);


  // usando a função para buscar dados do registro
  const handleFetchData = async () => {
    if (!searchId) {
      alert('Por favor, insira um ID de registro para buscar.');
      return;
    }
    setIsLoadingData(true);
    try {
      const dataFromDb = await fetchCertificateDataFromApi(searchId);

      // Cria um novo objeto para os dados formatados
      const formattedData: { [key: string]: string } = { ...dataFromDb };

      for (const key in formattedData) {
        // Se a chave contiver data, formata para extenso
        if (key.includes('data')) {
          // Cria uma nova chave com 'extenso' para não perder a original
          formattedData[`${key}_extenso`] = formatDateToExtenso(formattedData[key]);
          // Formata a data normal para dd/mm/yyyy
          formattedData[key] = new Date(formattedData[key]).toLocaleDateString('pt-BR');
        }
        if (key.includes('casamento')) {
          // Extrai a hora
          formattedData['hora_casamento'] = new Date(dataFromDb.data_casamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
      }

      setFormData(currentFormData => ({ ...currentFormData, ...formattedData }));
      alert('Dados do registro carregados com sucesso!');

    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // gerador de dados falsos baseado no nome da variável
  const generateFakeDataFor = (variableName: string): string => {
    const lowerCaseName = variableName.toLowerCase();
    if (lowerCaseName.includes('nome_completo') || lowerCaseName.includes('nome_registrado')) return faker.person.fullName();
    if (lowerCaseName.includes('nome_pai') || lowerCaseName.includes('contraente_1')) return faker.person.fullName({ sex: 'male' });
    if (lowerCaseName.includes('nome_mae') || lowerCaseName.includes('contraente_2')) return faker.person.fullName({ sex: 'female' });
    if (lowerCaseName.includes('avos')) return `${faker.person.fullName({ sex: 'male' })} e ${faker.person.fullName({ sex: 'female' })}`;
    if (lowerCaseName.includes('nome_oficial')) return faker.person.fullName();
    if (lowerCaseName.includes('nome_apos_casamento')) return faker.person.lastName();
    if (lowerCaseName.includes('cpf')) return faker.string.numeric(11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (lowerCaseName.includes('matricula') || lowerCaseName.includes('termo')) return faker.string.numeric(16);
    if (lowerCaseName.includes('data_extenso')) return faker.date.past({ years: 30 }).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    if (lowerCaseName.includes('nascimento') || lowerCaseName.includes('data')) return faker.date.past({ years: 30, refDate: '2004-01-01' }).toLocaleDateString('pt-BR');
    if (lowerCaseName.includes('hora')) return faker.date.recent().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (lowerCaseName.includes('cidade') || lowerCaseName.includes('naturalidade')) return faker.location.city();
    if (lowerCaseName.includes('residencia') || lowerCaseName.includes('endereco')) return faker.location.streetAddress(true);
    if (lowerCaseName.includes('uf') || lowerCaseName.includes('estado')) return faker.location.state({ abbreviated: true });
    if (lowerCaseName.includes('profissao')) return faker.person.jobTitle();
    if (lowerCaseName.includes('nacionalidade')) return 'Brasileiro(a)';
    if (lowerCaseName.includes('livro')) return `B-${faker.string.numeric(3)}`;
    if (lowerCaseName.includes('folha')) return faker.string.numeric(3);
    if (lowerCaseName.includes('regime_bens')) return faker.helpers.arrayElement(['Comunhão Parcial de Bens', 'Comunhão Universal de Bens', 'Separação Total de Bens']);
    if (lowerCaseName.includes('cargo')) return faker.helpers.arrayElement(['Oficial de Registro', 'Escrevente Autorizado']);
    return faker.string.alphanumeric(5);
  };

  const handleAutofill = () => {
    if (!template) return;
    const newFormData: { [key: string]: string } = {};
    template.variables.forEach(variable => {
      newFormData[variable] = generateFakeDataFor(variable);
    });
    setFormData(newFormData);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const title = file.name.replace('.docx', '').replace(/_/g, ' ');
    const actType = "Documento";
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const regex = /{{(.*?)}}/g;
        const matches = html.match(regex) || [];
        const variables = [...new Set(matches.map(v => v.replace(/{{|}}/g, '')))];
        setTemplate({ title, actType, file, htmlTemplate: html, variables });
        const initialFormData = variables.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        setFormData(initialFormData);
        setCurrentView('form');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Erro ao processar o arquivo DOCX:", error);
      alert("Não foi possível processar o arquivo. Verifique se é um .docx válido.");
    }
  }, []);

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const generateDocument = () => {
    if (!template) return;
    let finalHtml = template.htmlTemplate;
    Object.entries(formData).forEach(([key, value]) => {
      const replacement = `<span style="font-weight: bold;">${value || '__________'}</span>`;
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalHtml = finalHtml.replace(regex, replacement);
    });
    setFinalDocumentHtml(finalHtml);
    setCurrentView('editor');
  };

  const startOver = () => {
    setTemplate(null);
    setFormData({});
    setFinalDocumentHtml('');
    setCurrentView('upload');
    setSearchId('');
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // Largura A4
      tempDiv.innerHTML = finalDocumentHtml;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgHeightInPdf = pdfWidth / ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = -heightLeft;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Certidao-${template?.title.replace(/\s/g, '_') || 'documento'}.pdf`);

      // Remover o container temporário
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container">
      <h1>Testando usar minutas em formato docx para Protótipo da Orius</h1>

      {currentView === 'upload' && (
        <div id="upload-view">
          <h2>1. Importar Modelo de Certidão</h2>
          <div className="form-group">
            <label htmlFor="docx-file">Selecione o arquivo .docx do modelo</label>
            <input type="file" id="docx-file" accept=".docx" onChange={handleFileUpload} />
          </div>
          <p>Crie um arquivo .docx e use variáveis como <code>{"{{nome_registrado}}"}</code>, <code>{"{{data_nascimento}}"}</code>, etc.</p>
        </div>
      )}

      {currentView === 'form' && template && (
        <div id="form-view">
          <button onClick={startOver} className="secondary">Voltar e escolher outro modelo</button>
          <h2>2. Preencher Dados da Certidão: {template.title}</h2>

          <div style={{ background: '#e9ecef', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
              <label htmlFor="searchId" style={{ marginBottom: '0.25rem' }}>Buscar por ID do Registro</label>
              <input
                type="text"
                id="searchId"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                placeholder="Digite o ID (ex: 12345 ou 123456)"
              />
            </div>
            <button onClick={handleFetchData} disabled={isLoadingData} style={{ alignSelf: 'flex-end' }}>
              {isLoadingData ? 'Buscando...' : 'Buscar Dados'}
            </button>
          </div>

          <div className="variables-list">
            <strong>Variáveis do modelo:</strong>
            <p>{template.variables.map(v => <code key={v}>{v}</code>)}</p>
          </div>
          <br />

          {template.variables.map(variable => (
            <div key={variable} className="form-group">
              <label htmlFor={variable}>{variable.replace(/_/g, ' ').toUpperCase()}</label>
              <input
                type="text"
                id={variable}
                value={formData[variable] || ''}
                onChange={e => handleFormChange(variable, e.target.value)}
              />
            </div>
          ))}

          <button onClick={generateDocument} disabled={template.variables.length === 0}>
            Gerar Documento para Edição
          </button>
          <button onClick={handleAutofill} className="secondary" type="button">
            Preencher com Dados de Teste
          </button>
        </div>
      )}

      {currentView === 'editor' && (
        <div id="editor-view">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Usuário atual:</label>
            <select
              value={usuarioAtual.id}
              onChange={(e) => {
                const selectedUser = usuarios.find(u => u.id === parseInt(e.target.value));
                if (selectedUser) setUsuarioAtual(selectedUser);
              }}
            >
              {usuarios.map(user => (
                <option key={user.id} value={user.id}>{user.nome}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setCurrentView('form')} className="secondary">Voltar e Corrigir Dados</button>
          <h2>3. Edição Final da Certidão</h2>
          <p>O documento foi gerado. Faça os ajustes manuais necessários antes de finalizar.</p>
          <div className="a4-editor-container">
            <Editor
              apiKey='sny4ncto4hf42akdz2eqss2tqd0loo439vfttpuydjc2kqpi'
              value={finalDocumentHtml}
              onEditorChange={(content: string) => setFinalDocumentHtml(content)}
              init={{
                selector: 'textarea',
                user_id: 'ioshua',
                with: 794,
                height: 1123,
                menubar: false,
                browser_spellcheck: true,
                contextmenu: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'codesample', 'help', 'wordcount', 'autosave', 'searchreplace', 'quickbars', 'quickbars link', 'quickbars image editimage'
                ],
                autosave_ask_before_unload: true,
                toolbar: 'undo redo formatselect fontfamily fontsize link quickimage bold italic forecolor underline align, bullist numlist outdent indent removeformat preview fullscreen searchreplace help code codesample charmap quicktable',
                quickbars_selection_toolbar: 'bold italic underline | fontfamily | fontsize | quicklink blockquote | quicklink',
                quickbars_insert_toolbar: 'bold italic underline| fontfamily | fontsize | quicklink blockquote | quicklink |quickimage quicktable | hr pagebreak',
                quickbars_image_toolbar: 'alignleft aligncenter alignright | rotateleft rotateright | imageoptions',
                fontsize_formats: '4pt 5pt 6pt 7pt 8pt 9pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 30pt 32pt 34pt 36pt',
                font_family_formats: ` Times New Roman=Times New Roman, Times, serif; Arial=Arial, Helvetica, sans-serif; Calibri=Calibri, sans-serif; Courier New=Courier New, Courier, monospace; Georgia=Georgia, serif; Verdana=Verdana, Geneva, sans-serif;`,
                fullscreen_native: true,
                content_style: `
                  body {
                    font-size: 12pt;
                    }
                  `
              }}
            />
            <p style={{ fontStyle: 'italic', color: '#555' }}>
              Editando como: <strong>{usuarioAtual.nome}</strong>
            </p>
          </div>

          <br />
          <button onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? 'Baixando PDF...' : 'Finalizar e Baixar em PDF'}
          </button>
        </div>
      )}

    </div>
  );
};

export default App;
