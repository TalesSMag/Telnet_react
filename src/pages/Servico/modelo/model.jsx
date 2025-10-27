const handleDownload = async (id) => { 
    try {
      const res = await fetch(`http://localhost:3003/api/servico/${id}/detalhes`);
      const data = await res.json();
  
      if (!data || !data.servico) {
        alert("Não foi possível carregar os dados do serviço.");
        return;
      }
  
      const servico = data.servico;
      const materiais = data.materiais || [];
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // === BARRAS LATERAIS ===
      doc.setFillColor(0, 0, 0);
      doc.rect(12, 0, 0.4, pageHeight, "F"); // esquerda
      doc.rect(pageWidth - 12, 0, 0.4, pageHeight, "F"); // direita
  
      // === CABEÇALHO COM LOGO ===
      doc.addImage(Logo, "PNG", 14, 10, 25, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Relatório de Serviço", pageWidth / 2, 22, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32); // linha divisória

      // === GRID: DADOS DO CLIENTE E SERVIÇO ===
      let y = 40;
      const gridSpacing = 8;
      const colSpacing = pageWidth / 2 + 5;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Dados do Cliente", 14, y);
      y += gridSpacing;
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${servico.cliente?.nome || "—"}`, 14, y);
      y += gridSpacing;
      doc.text(`Empresa: ${servico.cliente?.empresa || "—"}`, 14, y);
      y += gridSpacing;
      doc.text(`Contato: ${servico.cliente?.contato || "—"}`, 14, y);
      y += gridSpacing;
      doc.text(`CNPJ: ${servico.cliente?.CNPJ || "—"}`, 14, y);

      // === DADOS DO SERVIÇO (lado direito) ===
      y = 40;
      doc.setFont("helvetica", "bold");
      doc.text("Dados do Serviço", colSpacing, y);
      y += gridSpacing;
      doc.setFont("helvetica", "normal");
      doc.text(`Técnico: ${servico.tecnico?.nome || "—"}`, colSpacing, y);
      y += gridSpacing;
      doc.text(
        `Data: ${new Date(servico.data + "T00:00:00").toLocaleDateString("pt-BR")}`,
        colSpacing,
        y
      );
      y += gridSpacing;
      doc.text(`Descrição: ${servico.descricaoServico || "—"}`, colSpacing, y);
      
      // === LINHA DIVISÓRIA ===
      y += 10;
      doc.line(14, y, pageWidth - 14, y);
      y += 8;

      // === TABELA DE MATERIAIS ===
      if (materiais.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Descrição", "Marca", "Qtd", "Preço", "Subtotal"]],
          body: materiais.map((m) => [
            m.material?.descricao || "—",
            m.material?.marca || "—",
            m.quantidade,
            `R$ ${Number(m.material?.preco).toFixed(2)}`,
            `R$ ${(m.quantidade * m.material?.preco).toFixed(2)}`,
          ]),
          styles: {
            fontSize: 10,
            lineWidth: 0.1,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [212529], 
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });
      }

      // === RODAPÉ COM TOTAIS ===
      const finalY = doc.lastAutoTable?.finalY || y + 20; // posição logo após a tabela
      const marginBottom = 20;
      const footerY = pageHeight - marginBottom;

      doc.setLineWidth(0.5);
      doc.line(14, footerY - 10, pageWidth - 14, footerY - 10); // linha separadora

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumo Financeiro", 14, footerY - 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const labelX = 14;
      const valueX = pageWidth - 60;
      const lineSpacing = 6;

      doc.text("Valor do Serviço:", labelX, footerY + lineSpacing);
      doc.text(`R$ ${Number(servico.valorServico).toFixed(2)}`, valueX, footerY + lineSpacing, { align: "right" });

      doc.text("Valor dos Materiais:", labelX, footerY + lineSpacing * 2);
      doc.text(`R$ ${Number(servico.valorMateriais).toFixed(2)}`, valueX, footerY + lineSpacing * 2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.text("Total Geral:", labelX, footerY + lineSpacing * 3);
      doc.text(`R$ ${Number(servico.total).toFixed(2)}`, valueX, footerY + lineSpacing * 3, { align: "right" });
  
      doc.save(`Servico_${servico.id}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
    }
  };